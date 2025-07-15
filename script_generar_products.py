import json
import os

INPUT = "andet_catalogo_completo/data_completo.txt"
OUTPUT = "products.json"
IMAGES_FOLDER = "andet_catalogo_completo"

def parse_line(line):
    # Formato esperado: imagen\tpagina\tdescripcion\ttexto\testilos_json
    parts = line.strip().split('\t')
    if len(parts) < 5:
        return None
    imagen, pagina, descripcion, texto, estilos = parts
    # Ejemplo de nombre de imagen: img_001_p1_02.jpg
    # Puedes extraer el código y nombre del producto del campo 'descripcion' o 'texto'
    # Aquí se asume que 'descripcion' tiene el nombre y 'texto' el código (ajusta según tu data real)
    nombre = descripcion.strip()
    codigo = texto.strip() if texto.strip() else f"COD-{imagen.split('_')[1]}"
    categoria = "Sin Categoría"  # Puedes mejorar esto si tienes la categoría en algún campo
    precio = "S/ 0.00"           # Puedes ajustar si tienes el precio en algún campo
    precio_anterior = ""
    descuento = ""
    disponibles = 10             # Valor por defecto, ajusta si tienes stock real

    return {
        "imagen": os.path.join(IMAGES_FOLDER, imagen),
        "nombre": nombre,
        "codigo": codigo,
        "categoria": categoria,
        "precio": precio,
        "precio_anterior": precio_anterior,
        "descuento": descuento,
        "disponibles": disponibles
    }

def main():
    products = []
    with open(INPUT, encoding="utf-8") as f:
        next(f)  # Saltar encabezado
        for idx, line in enumerate(f, 1):
            prod = parse_line(line)
            if prod:
                prod["id"] = idx
                products.append(prod)
    with open(OUTPUT, "w", encoding="utf-8") as f:
        json.dump(products, f, ensure_ascii=False, indent=2)
    print(f"✅ Generado {OUTPUT} con {len(products)} productos.")

if __name__ == "__main__":
    main()