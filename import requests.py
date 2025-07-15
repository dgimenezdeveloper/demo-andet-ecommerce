import requests
from bs4 import BeautifulSoup
import os
import json

URL = "https://andet.com.pe/catalogo/"
IMAGES_DIR = "imagenes_productos"
OUTPUT_JSON = "products.json"

os.makedirs(IMAGES_DIR, exist_ok=True)

headers = {
    "User-Agent": "Mozilla/5.0"
}

response = requests.get(URL, headers=headers)
soup = BeautifulSoup(response.text, "html.parser")

productos = []

# Cada producto está en un div con clase 'jet-listing-grid__item'
for idx, prod in enumerate(soup.select('.jet-listing-grid__item'), 1):
    # Nombre del producto
    nombre_tag = prod.select_one('.jet-listing-dynamic-field__content')
    nombre = nombre_tag.get_text(strip=True) if nombre_tag else f"Producto {idx}"

    # Imagen del producto: está en el atributo background-image del <style> dentro del producto
    style_tag = prod.find('style')
    imagen_url = ""
    if style_tag and "background-image" in style_tag.text:
        # Extraer la URL de la imagen del background-image
        import re
        match = re.search(r'background-image:url\("([^"]+)"\)', style_tag.text)
        if match:
            imagen_url = match.group(1)

    imagen_local = ""
    if imagen_url:
        img_ext = os.path.splitext(imagen_url)[-1].split("?")[0]
        img_filename = f"{idx:03d}_{nombre.replace(' ', '_').replace('/', '_')}{img_ext}"
        img_path = os.path.join(IMAGES_DIR, img_filename)
        try:
            img_resp = requests.get(imagen_url, headers=headers)
            if img_resp.status_code == 200 and img_resp.content:
                with open(img_path, "wb") as f:
                    f.write(img_resp.content)
                imagen_local = img_path
            else:
                print(f"⚠️ No se pudo descargar la imagen: {imagen_url}")
        except Exception as e:
            print(f"Error descargando imagen {imagen_url}: {e}")

    productos.append({
        "id": idx,
        "nombre": nombre,
        "imagen": imagen_local,
        "imagen_url": imagen_url
    })

with open(OUTPUT_JSON, "w", encoding="utf-8") as f:
    json.dump(productos, f, ensure_ascii=False, indent=2)

print(f"✅ Extraídos y descargados {len(productos)} productos. Guardado en {OUTPUT_JSON}")