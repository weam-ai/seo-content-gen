from fastapi import APIRouter

router = APIRouter()
import os
from langchain_openai import ChatOpenAI
import google.generativeai as genai
from openai import OpenAI
import json

OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')

def company_overview1(result):
    llm = ChatOpenAI(
        model="gpt-4.1",
        temperature=0,
        api_key=OPENAI_API_KEY
    )

    messages = [
        {
            "role": "system",
            "content": """
            You are a professional business analyst with expertise in summarizing corporate information and structuring it in a clear, engaging, and professional manner.

            Your task is to analyze the provided sources and extract key information to create a structured company overview. You must return your response as a valid JSON object with the following structure:

            {
                "company_details": "A comprehensive company overview (500-800 words) in Markdown format",
                "company_name": "The official company name",
                "owner_bio": "Biography of the company owner/founder/CEO (if available in sources)",
                "target_audience": "Comma-separated string of the company's the **primary target audience** target audiences and customer segments"
            }

            **For company_details field:**
            - Write a well-structured company overview using Markdown formatting
            - The introduction should briefly describe the company's role in the industry
            - Use **bold (`**`) for section headers** and ensure bullet points or numbered lists are properly formatted
            - Maintain a professional and engaging tone
            
            **Key Sections to Include in company_details:**
            - Begin with a **concise and engaging introduction** (1-2 sentences) summarizing the company, but **do not use a section heading for it**
            - **Company Mission and Vision**
            - **Products and Services**  
            Format this section like the example below:
            ```
            **Products and Services**  
          
            [Company Name] provides a comprehensive suite of services designed to [purpose of services]. Their expertise spans [general service categories], ensuring businesses [key benefits].  
          
            Key services include:  
          
            1. **Service Name**  
                Service description  
            2. **Service Name**  
                Service description  
             ```
            - **Market Position**
            - **Recent News and Developments**
            - **Corporate Culture and Values** (if relevant)
            - **Conclusion** (1-2 sentences summarizing the company's strengths and future outlook)
            
            **For company_name field:**
            - Extract the official company name from the sources
            - If not clearly stated, use the most commonly referenced name
            
            **For owner_bio field:**
            - Extract information about the company owner, founder, or CEO
            - Include their background, experience, and role in the company
            - If no owner/founder information is available, return "Information not available in provided sources"
            
            **For target_audience field:**
            - Extract information about the company's target audiences and return as a comma-separated string
            - Include different customer segments, demographics, industry focus, business types, etc.
            - Format as: "Entrepreneurs & Startups, Small Business Owners, Marketing Agencies, Nutrition Professionals"
            - If no target audience information is available, return "Information not available"
            - Identify the **main audience segments** the company serves.
            - Keep it **brief**, **to the point**, and **concise** (only primary audience).
            - Provide the audience in **heading format only** (e.g., "Small Business Owners", "Health-conscious Consumers", etc.).
            - Do **not** include additional descriptions, only the headings.
            
            **Important:**
            - Return ONLY a valid JSON object, no additional text
            - Ensure all JSON strings are properly escaped
            - Only include information from articles if the article links are related to the company's URL or its name
            - Exclude unrelated pages
            - Use natural, human-like sentence flow in the content
            - Make the text engaging and informative, avoiding robotic language
            """
        },
        {
            "role": "user",
            "content": f"Here are the sources:\n\n{result}"
        }
    ]

    response = llm.invoke(messages)
    
    try:
        # Parse the JSON response
        json_response = json.loads(response.content)
        return json_response
    except json.JSONDecodeError as e:
        # Fallback in case the LLM doesn't return valid JSON
        return {
            "company_details": response.content,
            "company_name": "Unable to extract",
            "owner_bio": "Unable to extract",
            "target_audience": "Information not available"
        }
