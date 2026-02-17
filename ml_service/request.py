import requests

url = "https://leviAsher-ConsoliScan.hf.space/detect"

with open("main.jpg", "rb") as f:
    files = {"file": ("main.jpg", f, "image/jpeg")}  # <-- specify MIME type
    response = requests.post(url, files=files)

print("Status code:", response.status_code)
print("Response content:", response.text)

if response.status_code == 200:
    print("JSON:", response.json())
