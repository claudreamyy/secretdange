import os
from PIL import Image

dossier = r"C:\Users\HP ProBook\Downloads\New folder (4)"

start = 62  # numéro de départ

fichiers = [f for f in os.listdir(dossier) if f.lower().endswith((".jpg", ".jpeg"))]
fichiers.sort()

for i, fichier in enumerate(fichiers, start=start):
    chemin_jpg = os.path.join(dossier, fichier)
    
    img = Image.open(chemin_jpg)
    img = img.convert("RGB")
    
    nouveau_nom = f"{i}.png"
    chemin_png = os.path.join(dossier, nouveau_nom)
    
    img.save(chemin_png, "PNG")

print("Conversion + renommage terminés !")