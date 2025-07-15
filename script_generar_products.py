import json
import os

INPUT = "andet_catalogo_completo/data_completo.txt"
OUTPUT = "products.json"

def parse_line(line, idx):
    # Formato: imagen\tpagina\tdescripcion\ttexto\testilos_json
    parts = line.strip().split('\t')
    if len(parts) < 5:
        return None
    imagen, pagina, descripcion, texto, estilos = parts

    # Ignorar líneas que no son productos (por ejemplo, encabezados o separadores de página)
    if not imagen.lower().endswith(('.jpg', '.png', '.jpeg')):
        return None

    nombre = descripcion.strip() if descripcion.strip() else "Producto sin nombre"
    codigo = texto.strip() if texto.strip() else f"COD-{idx:03d}"
    categoria = "Sin Categoría"
    precio = "S/ 0.00"
    precio_anterior = ""
    descuento = ""
    disponibles = 10

    return {
        "imagen": f"andet_catalogo_completo/{imagen}",
        "nombre": nombre,
        "codigo": codigo,
        "categoria": categoria,
        "precio": precio,
        "precio_anterior": precio_anterior,
        "descuento": descuento,
        "disponibles": disponibles,
        "id": idx
    }

def main():
    products = []
    with open(INPUT, encoding="utf-8") as f:
        next(f)  # Saltar encabezado
        for idx, line in enumerate(f, 1):
            prod = parse_line(line, idx)
            if prod:
                products.append(prod)
    with open(OUTPUT, "w", encoding="utf-8") as f:
        json.dump(products, f, ensure_ascii=False, indent=2)
    print(f"✅ Generado {OUTPUT} con {len(products)} productos.")

if __name__ == "__main__":
    main()