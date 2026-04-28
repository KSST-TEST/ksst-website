from PIL import Image, ImageDraw, ImageFont
import os

# Load the image
img_path = 'images/Devi Mahatmiyam Inaug.jpeg'
img = Image.open(img_path)
width, height = img.size

# Create a copy to work with
img_edited = img.copy()
draw = ImageDraw.Draw(img_edited)

# Try to load a nice font, fall back to default if not available
try:
    # Try different font sizes and paths
    title_font = ImageFont.truetype("arial.ttf", 48)
    regular_font = ImageFont.truetype("arial.ttf", 36)
    small_font = ImageFont.truetype("arial.ttf", 28)
except:
    # Use default font if truetype fonts not available
    title_font = ImageFont.load_default()
    regular_font = ImageFont.load_default()
    small_font = ImageFont.load_default()

# Define colors
white = (255, 255, 255)
gold = (255, 215, 0)

# Remove old date/time text area by filling with transparent or dark background
# This is approximate - we'll draw over the old text
# The old text is around coordinates (roughly middle-lower part of image)

# Add new text
# DATE
date_text = "DATE: 30th April, 2026"
date_bbox = draw.textbbox((0, 0), date_text, font=regular_font)
date_width = date_bbox[2] - date_bbox[0]
date_x = (width - date_width) // 2
date_y = height - 280

# TIME
time_text = "TIME: 9 AM IST"
time_bbox = draw.textbbox((0, 0), time_text, font=regular_font)
time_width = time_bbox[2] - time_bbox[0]
time_x = (width - time_width) // 2
time_y = height - 220

# VENUE
venue_text = "Arulmiku Mariyamman Tirukkoyil,"
venue_text2 = "Pappanaickenpalayam, Coimbatore"
venue_bbox = draw.textbbox((0, 0), venue_text, font=small_font)
venue_width = venue_bbox[2] - venue_bbox[0]
venue_x = (width - venue_width) // 2
venue_y = height - 160

draw.text((date_x, date_y), date_text, fill=white, font=regular_font)
draw.text((time_x, time_y), time_text, fill=white, font=regular_font)
draw.text((venue_x, venue_y), venue_text, fill=white, font=small_font)

# Center the second line of venue
venue_bbox2 = draw.textbbox((0, 0), venue_text2, font=small_font)
venue_width2 = venue_bbox2[2] - venue_bbox2[0]
venue_x2 = (width - venue_width2) // 2
draw.text((venue_x2, venue_y + 50), venue_text2, fill=white, font=small_font)

# Save the modified image
img_edited.save(img_path, quality=95)
print("Image updated successfully!")
print(f"Updated with:")
print(f"  Date: 30th April, 2026")
print(f"  Time: 9 AM IST")
print(f"  Venue: Arulmiku Mariyamman Tirukkoyil, Pappanaickenpalayam, Coimbatore")
