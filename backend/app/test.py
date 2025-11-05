from ollama import chat

messages = [
  {
    'role': 'user',
    'content': '¿Porque el cielo es azul?',
  },
]

response = chat('gpt-oss:20b', messages=messages, stream=True)
for chunk in response:
    print(chunk['message']['content'], end='', flush=True)