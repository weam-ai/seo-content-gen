FROM python:3.11-slim AS base
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1
WORKDIR /app

# System deps for Playwright and others used by main.py (if needed)
RUN apt-get update && apt-get install -y \
    curl \
    wget \
    libnss3 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libxkbcommon0 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    libgbm1 \
    libasound2 \
    libpangocairo-1.0-0 \
    libcups2 \
    libxshmfence1 \
    fonts-liberation \
    libpango-1.0-0 \
    libgtk-3-0 \
    && rm -rf /var/lib/apt/lists/*

# Upgrade pip and install wheel
RUN pip install --upgrade pip setuptools wheel

COPY requirements.txt ./requirements.txt
# Install requirements with more verbose output and error handling
RUN pip install --no-cache-dir --verbose -r requirements.txt || \
    (echo "First install failed, trying with --no-deps for problematic packages" && \
     pip install --no-cache-dir --no-deps -r requirements.txt)

COPY . .

ENV PORT=9002
EXPOSE 9002
CMD ["python", "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "9002"]


