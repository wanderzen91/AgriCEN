FROM python:3.10-slim

WORKDIR /app


COPY requirements.txt requirements.txt
RUN python -m pip install --upgrade pip
RUN apt-get update && apt-get install -y libpq-dev gcc
RUN pip install -r requirements.txt

COPY . .

CMD ["python", "views.py"]
