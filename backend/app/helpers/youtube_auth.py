# youtube_auth.py

from services.youtube_utils import authenticate_youtube

youtube = authenticate_youtube()
print("Authenticated and token saved.")
