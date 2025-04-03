import os
import datetime
import time
import random
import calendar
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

# Instructions:

# Log in to YouTube on StreamLabs
# Run script, pick title and desired time to stream
# Press Go Live in StreamLabs, select YouTube, choose "Upcoming event"
# Select the right broadcast, go live
    # If you get an error, you need to force quit the app and try again
    # It should work now
# Look at stream page on localhost, after a few seconds the stream should pop up :)

# YouTube API Scope
SCOPES = ["https://www.googleapis.com/auth/youtube.force-ssl"]


def authenticate_youtube():
    """Authenticate and return the YouTube API client."""
    creds = None
    if os.path.exists("token.json"):
        creds = Credentials.from_authorized_user_file("token.json", SCOPES)

    if not creds or not creds.valid:
        flow = InstalledAppFlow.from_client_secrets_file("client_secrets.json", SCOPES)
        creds = flow.run_local_server(port=5000)
        with open("token.json", "w") as token:
            token.write(creds.to_json())

    return build("youtube", "v3", credentials=creds)


def prompt_broadcast_details():
    """Prompt user for broadcast title, date, and time."""
    title = input("Enter the broadcast title: ").strip()

    while True:
        try:
            # Get current UTC date and time
            now = datetime.datetime.utcnow()
            year = now.year  # Keep everything in the current year

            # Select month (1-12)
            month = int(input(f"Enter the month (1-12): ").strip())
            if month < 1 or month > 12:
                raise ValueError("Invalid month")

            # Get correct max days for the selected month
            max_days = calendar.monthrange(year, month)[1]

            # Select day (1-max_days)
            day = int(input(f"Enter the day (1-{max_days}): ").strip())
            if day < 1 or day > max_days:
                raise ValueError(f"Invalid day! The selected month has {max_days} days.")

            # Select time (HH:MM)
            time_input = input("Enter start time (HH:MM in 24-hour format, e.g., 15:30): ").strip()
            start_time = datetime.datetime.strptime(time_input, "%H:%M").time()

            # Combine selected date and time
            scheduled_start = datetime.datetime(year, month, day, start_time.hour, start_time.minute)

            # Fixing UTC early start if necessary
            min_future_time = now + datetime.timedelta(minutes=1)
            if scheduled_start < min_future_time:
                print("Fixing UTC time ...")
                scheduled_start = min_future_time

            # Debugging output
            print("\n DEBUG INFO:")
            print(f"Current UTC Time: {now.strftime('%Y-%m-%d %H:%M:%S UTC')}")
            print(f"User Selected Date & Time: {scheduled_start.strftime('%Y-%m-%d %H:%M UTC')}")
            print(f"Minimum Allowed Start Time: {min_future_time.strftime('%Y-%m-%d %H:%M UTC')}")
            print(f"Final Scheduled Start Time: {scheduled_start.strftime('%Y-%m-%d %H:%M UTC')}\n")

            return title, scheduled_start
        except ValueError as e:
            print(f"Invalid input: {e}. Please enter a valid month, day, and time.")


def create_broadcast(youtube, title, scheduled_start, description="", max_retries=5):
    """Create a new YouTube live broadcast, retrying on errors."""
    start_time = scheduled_start.isoformat() + "Z"
    end_time = (scheduled_start + datetime.timedelta(hours=3)).isoformat() + "Z"

    print(f"\n[DEBUG] Sending start time to YouTube API: {start_time}")
    print(f"[DEBUG] End time for broadcast: {end_time}")

    retries = 0
    while retries < max_retries:
        try:
            request = youtube.liveBroadcasts().insert(
                part="snippet,status,contentDetails",
                body={
                    "snippet": {
                        "title": title,
                        "description": description,
                        "scheduledStartTime": start_time,
                        "scheduledEndTime": end_time
                    },
                    "status": {
                        "privacyStatus": "public",
                        "selfDeclaredMadeForKids": False
                    },
                    "contentDetails": {
                        "enableAutoStart": False,
                        "enableAutoStop": True
                    }
                }
            )
            response = request.execute()
            broadcast_id = response["id"]
            youtube_url = f"https://www.youtube.com/embed/{broadcast_id}"

            print(f"\n Broadcast '{title}' scheduled at {scheduled_start.strftime('%Y-%m-%d %H:%M UTC')}")
            print(f" Watch Live: {youtube_url}")

            # Only update live_url.txt if the broadcast is starting now
            now = datetime.datetime.utcnow()
            if abs((scheduled_start - now).total_seconds()) < 300:  # Within 5 minutes
                with open("live_url.txt", "w") as file:
                    file.write(youtube_url)

            return broadcast_id, youtube_url
        except HttpError as e:
            error_message = str(e)
            print(f"ERROR: {error_message}")

            if "503" in error_message:
                wait_time = random.randint(5, 15)
                print(f"YouTube API is temporarily unavailable. Retrying in {wait_time} seconds...")
                time.sleep(wait_time)
                retries += 1
            else:
                break  # Stop retrying if it's not a 503 error

    print("ERROR: Unable to schedule broadcast after multiple attempts.")
    return None, None


def schedule_broadcast(title: str, month: int, day: int, time_str: str, description: str = ""):
    youtube = authenticate_youtube()

    now = datetime.datetime.utcnow()
    year = now.year
    start_time = datetime.datetime.strptime(time_str, "%H:%M").time()
    scheduled_start = datetime.datetime(year, month, day, start_time.hour, start_time.minute)

    min_future_time = now + datetime.timedelta(minutes=1)
    if scheduled_start < min_future_time:
        scheduled_start = min_future_time

    return create_broadcast(youtube, title, scheduled_start, description)


def get_scheduled_broadcasts():
    """Fetch all scheduled broadcasts from YouTube."""
    try:
        youtube = authenticate_youtube()
        
        # Get upcoming broadcasts
        request = youtube.liveBroadcasts().list(
            part="snippet,contentDetails,status",
            broadcastStatus="upcoming",
            maxResults=50
        )
        response = request.execute()

        broadcasts = []
        for item in response.get("items", []):
            # Parse scheduled start time first since we need it for both cases
            start_time = None
            if "scheduledStartTime" in item["snippet"]:
                start_time = datetime.datetime.strptime(
                    item["snippet"]["scheduledStartTime"],
                    "%Y-%m-%dT%H:%M:%SZ"
                )

            # Set default values for date and time
            date_str = datetime.datetime.utcnow().strftime("%Y-%m-%d")
            time_str = "00:00"

            # Update with actual values if we have them
            if start_time:
                date_str = start_time.strftime("%Y-%m-%d")
                time_str = start_time.strftime("%H:%M")

            broadcast = {
                "id": item["id"],
                "title": item["snippet"]["title"],
                "description": item["snippet"].get("description", ""),
                "url": f"https://www.youtube.com/embed/{item['id']}",
                "status": item["status"]["lifeCycleStatus"],
                "date": date_str,
                "time": time_str
            }

            broadcasts.append(broadcast)

        return broadcasts
    except HttpError as e:
        print(f"An HTTP error occurred: {e}")
        return []


def delete_broadcast(broadcast_id: str):
    """Delete a broadcast from YouTube."""
    try:
        youtube = authenticate_youtube()
        request = youtube.liveBroadcasts().delete(
            id=broadcast_id
        )
        request.execute()
        return True
    except Exception as e:
        print(f"An error occurred: {e}")
        return False


def update_broadcast(broadcast_id: str, title: str, scheduled_start: datetime.datetime):
    """Update an existing broadcast on YouTube."""
    try:
        youtube = authenticate_youtube()
        
        start_time = scheduled_start.isoformat() + "Z"
        end_time = (scheduled_start + datetime.timedelta(hours=3)).isoformat() + "Z"

        request = youtube.liveBroadcasts().update(
            part="snippet",
            body={
                "id": broadcast_id,
                "snippet": {
                    "title": title,
                    "scheduledStartTime": start_time,
                    "scheduledEndTime": end_time
                }
            }
        )
        response = request.execute()
        return {
            "id": response["id"],
            "title": response["snippet"]["title"],
            "url": f"https://www.youtube.com/embed/{response['id']}",
            "date": scheduled_start.strftime("%Y-%m-%d"),
            "time": scheduled_start.strftime("%H:%M")
        }
    except Exception as e:
        print(f"An error occurred: {e}")
        return None


def get_current_broadcast():
    """Get the current active broadcast from YouTube."""
    try:
        youtube = authenticate_youtube()
        
        # Get live broadcasts
        request = youtube.liveBroadcasts().list(
            part="snippet,contentDetails,status",
            broadcastStatus="active",
            maxResults=1
        )
        response = request.execute()

        if response.get("items"):
            item = response["items"][0]
            broadcast_id = item["id"]
            youtube_url = f"https://www.youtube.com/embed/{broadcast_id}"
            
            # Update live_url.txt with current broadcast
            with open("live_url.txt", "w") as file:
                file.write(youtube_url)
            
            return {
                "id": broadcast_id,
                "title": item["snippet"]["title"],
                "url": youtube_url,
                "status": item["status"]["lifeCycleStatus"]
            }
        
        # If no active broadcast, try to get the next upcoming broadcast
        request = youtube.liveBroadcasts().list(
            part="snippet,contentDetails,status",
            broadcastStatus="upcoming",
            maxResults=1,
            orderBy="startTime"
        )
        response = request.execute()
        
        if response.get("items"):
            item = response["items"][0]
            scheduled_start = datetime.datetime.strptime(
                item["snippet"]["scheduledStartTime"],
                "%Y-%m-%dT%H:%M:%SZ"
            )
            # If the next broadcast is starting within 5 minutes, consider it current
            now = datetime.datetime.utcnow()
            if abs((scheduled_start - now).total_seconds()) < 300:
                broadcast_id = item["id"]
                youtube_url = f"https://www.youtube.com/embed/{broadcast_id}"
                with open("live_url.txt", "w") as file:
                    file.write(youtube_url)
                return {
                    "id": broadcast_id,
                    "title": item["snippet"]["title"],
                    "url": youtube_url,
                    "status": "starting_soon"
                }
        
        # Clear live_url.txt if no current broadcast
        with open("live_url.txt", "w") as file:
            file.write("")
        
        return None
    except Exception as e:
        print(f"An error occurred: {e}")
        return None


if __name__ == "__main__":
    main()
