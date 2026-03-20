# —-----------------------------------------------------------
# – IMAGEN BASE / BASE IMAGE
# —---------------------------------------------------------
FROM python:3.11-slim

# —-----------------------------------------------------------
# – DEPENDENCIAS DEL SISTEMA / SYSTEM DEPENDENCIES
# —---------------------------------------------------------
RUN apt-get update && apt-get install -y \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# —-----------------------------------------------------------
# – DIRECTORIO DE TRABAJO / WORK DIRECTORY
# —---------------------------------------------------------
WORKDIR /app

# —-----------------------------------------------------------
# – DEPENDENCIAS DE PYTHON / PYTHON DEPENDENCIES
# —---------------------------------------------------------
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# —-----------------------------------------------------------
# – CÓDIGO FUENTE / SOURCE CODE
# —---------------------------------------------------------
COPY . .

# —-----------------------------------------------------------
# – CONFIGURACIÓN DE PUERTO / PORT CONFIGURATION
# —---------------------------------------------------------
ENV PORT 8080
EXPOSE 8080

# —-----------------------------------------------------------
# – EJECUCIÓN / EXECUTION
# —---------------------------------------------------------
CMD exec gunicorn --bind :$PORT --workers 1 --threads 8 --timeout 0 main:app