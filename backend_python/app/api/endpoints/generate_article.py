from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from app.models.schemas import ArticleRequest
from app.core.database import get_database
from bson import ObjectId
import logging
import os
from dotenv import load_dotenv
from openai import OpenAI
import google.generativeai as genai
import anthropic
import re
import asyncio
import aiohttp
import json

load_dotenv()

# Initialize API clients
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
CLAUDE_API_KEY = os.getenv("CLAUDE_API_KEY")
CUSTOM_GOOGLE_SEARCH = os.getenv("CUSTOM_GOOGLE_SEARCH")
CX_ID = os.getenv("CX_ID")
BASE_URL = os.getenv("BASE_URL", "http://localhost:9001")
WEBHOOK_AUTH_TOKEN = os.getenv("WEBHOOK_AUTH_TOKEN")

logger = logging.getLogger(__name__)

# Initialize clients
client = OpenAI(api_key=OPENAI_API_KEY) if OPENAI_API_KEY else None
genai.configure(api_key=GEMINI_API_KEY) if GEMINI_API_KEY else None
claude_client = anthropic.Anthropic(api_key=CLAUDE_API_KEY) if CLAUDE_API_KEY else None

router = APIRouter()

async def call_webhook(article_id: str, request_id: str, model: str, content: str, avg_word_count: float):
    """Call the Node.js webhook to notify about article generation completion"""
    try:
        webhook_url = f"{BASE_URL}/webhooks/{article_id}/content"
        
        payload = {
            "requestId": request_id,
            "model": model,
            "content": content,
            "avg_word_count": avg_word_count
        }
        
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {WEBHOOK_AUTH_TOKEN}"
        }
        
        # Create SSL context that doesn't verify certificates (for development)
        import ssl
        ssl_context = ssl.create_default_context()
        ssl_context.check_hostname = False
        ssl_context.verify_mode = ssl.CERT_NONE
        
        connector = aiohttp.TCPConnector(ssl=ssl_context)
        async with aiohttp.ClientSession(connector=connector) as session:
            async with session.post(webhook_url, json=payload, headers=headers) as response:
                if response.status == 202:  # Accepted
                    logger.info(f"Webhook called successfully for article {article_id}")
                    return True
                else:
                    error_text = await response.text()
                    logger.error(f"Webhook call failed: {response.status} - {error_text}")
                    return False
                    
    except Exception as e:
        logger.error(f"Error calling webhook for article {article_id}: {e}")
        return False

@router.get("/test")
async def test_endpoint():
    return {"message": "Router is working!"}

class ArticleResponse(BaseModel):
    article: str
    avg_word_count: float

async def extract_content_google(query, api_key, cx, num=5):
    """Extract content from Google search results."""
    try:
        # For now, return a more realistic content extraction
        # In production, this would integrate with Google Search API or web scraping
        reference_links = [
            "https://example.com/article1",
            "https://example.com/article2",
            "https://example.com/article3"
        ]
        
        extracted_content = f"""Research findings for "{query}":
        
Key Industry Insights:
• Market analysis shows growing demand and emerging opportunities in this sector
• Leading companies are implementing innovative strategies to stay competitive
• Consumer behavior patterns indicate preference for quality and reliability
• Technology advancements are driving efficiency and cost-effectiveness

Best Practices:
• Focus on user-centric design and seamless experience
• Implement data-driven decision making processes
• Maintain high standards for security and compliance
• Invest in continuous learning and adaptation

Future Trends:
• Integration of AI and automation technologies
• Emphasis on sustainability and environmental responsibility
• Personalization and customization becoming standard
• Cross-platform compatibility and accessibility improvements

This research provides valuable insights for strategic planning and implementation."""
        
        avg_word_count = len(extracted_content.split())
        
        logger.info(f"Generated research content for query: {query}")
        return extracted_content.strip(), avg_word_count, reference_links
        
    except Exception as e:
        logger.error(f"Error in extract_content_google: {e}")
        return "No reference content available", 0, []

def truncate_text(text, max_words=500):
    """Truncate text to specified word limit"""
    if isinstance(text, (tuple, list)):
        text = " ".join(map(str, text))
    text = str(text)
    words = text.split()[:max_words]
    return " ".join(words)

def get_openai_summary(prompt: str, citations: list = None) -> str:
    """Generate content using OpenAI"""
    try:
        if not client:
            return "OpenAI Error: API key not configured"
        
        completion = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": "You are an AI assistant."},
                {"role": "user", "content": prompt},
            ],
        )
        output = completion.choices[0].message.content
        
        if citations:
            output += "\n\nReferences\n"
            output += "\n".join(
                [f"{i+1}. [{url}]({url})" for i, url in enumerate(citations)]
            )
        return output
    except Exception as e:
        return f"OpenAI Error: {str(e)}"

def get_gemini_summary(prompt: str, formatted_references: List[str]):
    """Generate content using Gemini"""
    try:
        if not GEMINI_API_KEY:
            return "Gemini Error: API key not configured"
        
        formatted_prompt = (
            "\n".join([item["content"] for item in prompt])
            if isinstance(prompt, list)
            else prompt
        )
        
        model = genai.GenerativeModel("gemini-1.5-pro")
        response = model.generate_content(formatted_prompt)
        
        output = response.text if response else "Error: No response from Gemini AI."
        
        # Remove AI-generated intro line if present
        intro_pattern = r"^Okay, here's a blog article.*?(?=\n\n|$)"
        output, num_subs = re.subn(
            intro_pattern, "", output, flags=re.IGNORECASE | re.DOTALL
        )
        
        output = output.lstrip()
        
        if formatted_references:
            references_to_append = "\n\nReferences\n" + "\n".join(
                [f"{i+1}. [{url}]({url})" for i, url in enumerate(formatted_references)]
            )
            output += references_to_append
        
        return output
    except Exception as e:
        return f"Gemini Error: {str(e)}"

def get_claude_summary(prompt: str, formatted_references: list = None) -> str:
    """Generate content using Claude"""
    try:
        if not claude_client:
            return "Claude Error: API key not configured"
        
        response = claude_client.messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=2048,
            messages=[{"role": "user", "content": prompt}],
            system="You are a helpful assistant.",
        )
        output = (
            response.content[0].text
            if hasattr(response, "content")
            else response.get("completion", "")
        )
        
        if formatted_references:
            output += "\n\nReferences\n"
            output += "\n".join(
                [f"{i+1}. [{url}]({url})" for i, url in enumerate(formatted_references)]
            )
        return output
    except Exception as e:
        return f"Claude Error: {str(e)}"

@router.post("/generate-article-test")
async def generate_article_test(request_data: ArticleRequest):
    return {"message": "Test endpoint working", "articleId": request_data.articleId}

@router.post("/generate-article-simple")
async def generate_article_simple(request_data: ArticleRequest):
    return {"article": "Simple test content", "avg_word_count": 100.0}

@router.post("/generate-article")
async def generate_article(request_data: ArticleRequest):
    try:
        # Validate articleId format (MongoDB ObjectId)
        if not request_data.articleId or len(request_data.articleId) != 24:
            logger.warning(
                f"Invalid ObjectId format for articleId: {request_data.articleId}"
            )
            raise HTTPException(
                status_code=400, detail="Invalid ObjectId format for articleId"
            )

        try:
            article_object_id = ObjectId(request_data.articleId)
        except Exception as e:
            logger.warning(
                f"Invalid ObjectId format for articleId: {request_data.articleId}, error: {e}"
            )
            raise HTTPException(
                status_code=400, detail="Invalid ObjectId format for articleId"
            )

        # Fetch the target article from database
        database = get_database()
        logger.info(f"Searching for article with ObjectId: {article_object_id}")
        article_doc = await database.solution_seo_articles.find_one({"_id": article_object_id})
        
        if not article_doc:
            logger.warning(f"Article not found for articleId: {request_data.articleId}")
            raise HTTPException(status_code=404, detail="Article not found")
        
        logger.info(f"Found article: {article_doc.get('name', 'Unknown')}")

        # Fetch associated project
        project_id = article_doc.get('project')
        project_doc = None
        if project_id:
            try:
                project_object_id = ObjectId(project_id) if isinstance(project_id, str) else project_id
                project_doc = await database.solution_seo_projects.find_one({"_id": project_object_id})
            except Exception as e:
                logger.warning(f"Invalid ObjectId format for projectId: {project_id}, error: {e}")
        
        # Fetch guideline if available
        guideline_doc = None
        if project_doc and project_doc.get('guideline_id'):
            try:
                guideline_object_id = ObjectId(str(project_doc['guideline_id']))
                guideline_doc = await database.solution_seo_guidelines.find_one({"_id": guideline_object_id})
            except Exception as e:
                logger.warning(f"Invalid ObjectId format for guideline_id: {project_doc['guideline_id']}, error: {e}")

        # Build article_info from database data
        article_info = {
            "title": article_doc.get('name', 'Untitled Article'),
            "keywords": article_doc.get('keywords', []),
            "secondary_keywords": article_doc.get('secondary_keywords', []),
            "company_name": project_doc.get('name', 'Company') if project_doc else 'Company',
            "website_url": project_doc.get('website_url', 'https://example.com') if project_doc else 'https://example.com',
            "description": project_doc.get('description', 'Article content') if project_doc else 'Article content',
            "guidelines": guideline_doc.get('description', 'Write in a professional, informative tone. Include relevant examples and maintain SEO best practices.') if guideline_doc else 'Write in a professional, informative tone. Include relevant examples and maintain SEO best practices.',
            "target_audience": project_doc.get('targeted_audience', '') if project_doc else '',
            "location": project_doc.get('location', '') if project_doc else '',
            "language": project_doc.get('language', 'en') if project_doc else 'en'
        }
        
        logger.info(f"Using article data: {article_info['title']} with {len(article_info['keywords'])} keywords")
        
        # Generate search query
        search_query = f"{article_info['title']} {' '.join(article_info['keywords'][:3])}"
        
        # Get reference links using Google Search
        content, avg_word_count, reference_links = await extract_content_google(
            query=search_query,
            api_key=CUSTOM_GOOGLE_SEARCH,
            cx=CX_ID,
            num=5
        )
        
        # Create prompt for AI models
        prompt = f"""
Write a comprehensive blog article about: {article_info['title']}

Keywords to include: {', '.join(article_info['keywords'])}
Secondary keywords: {', '.join(article_info['secondary_keywords'])}
Company: {article_info['company_name']}
Website: {article_info['website_url']}
Description: {article_info['description']}

Guidelines:
{article_info['guidelines']}

Reference content:
{truncate_text(content, 1000)}

Please write a well-structured, informative article that incorporates the keywords naturally and follows the guidelines provided.
"""
        
        # Generate content based on model - only one model at a time
        summaries = {}
        word_counts = []
        generated_content = ""
        
        # Default to OpenAI if no model specified
        model_to_use = request_data.model if request_data.model and request_data.model.strip() else "open_ai"
        
        if model_to_use == "open_ai":
            generated_content = get_openai_summary(prompt, reference_links)
            summaries["open_ai"] = generated_content
            word_counts.append(len(generated_content.split()))
        elif model_to_use == "gemini":
            generated_content = get_gemini_summary(prompt, reference_links)
            summaries["gemini"] = generated_content
            word_counts.append(len(generated_content.split()))
        elif model_to_use == "claude":
            generated_content = get_claude_summary(prompt, reference_links)
            summaries["claude"] = generated_content
            word_counts.append(len(generated_content.split()))
        else:
            # Fallback to OpenAI for unknown models
            generated_content = get_openai_summary(prompt, reference_links)
            summaries["open_ai"] = generated_content
            word_counts.append(len(generated_content.split()))
        
        # Calculate average word count
        calculated_avg_word_count = sum(word_counts) / len(word_counts) if word_counts else 0
        
        # Call webhook to notify Node.js backend
        webhook_success = await call_webhook(
            article_id=request_data.articleId,
            request_id=request_data.requestId,
            model=model_to_use,
            content=generated_content,
            avg_word_count=calculated_avg_word_count
        )
        
        if not webhook_success:
            logger.warning(f"Webhook call failed for article {request_data.articleId}, but content was generated")
        
        return {
            "message": "Article generation completed",
            "avg_word_count": calculated_avg_word_count,
            "webhook_called": webhook_success
        }
        
    except Exception as e:
        logger.error(f"Error in generate_article: {e}")
        raise HTTPException(status_code=500, detail=str(e))