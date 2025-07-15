import os, requests, json, time
from bs4 import BeautifulSoup
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, NoSuchElementException
from webdriver_manager.chrome import ChromeDriverManager

# URL objetivo
BASE_URL = "https://andet.com.pe/catalogo/"
FOLDER = "andet_catalogo_completo"
FORCE_PAGES = 12  # Forzar número de páginas si la detección automática falla
os.makedirs(FOLDER, exist_ok=True)

# Iniciar navegador headless
options = webdriver.ChromeOptions()
options.add_argument("--headless")
options.add_argument("--no-sandbox")
options.add_argument("--disable-dev-shm-usage")
options.add_argument("--disable-gpu")
options.add_argument("--window-size=1920,1080")
options.add_argument("--disable-blink-features=AutomationControlled")
options.add_experimental_option("excludeSwitches", ["enable-automation"])
options.add_experimental_option('useAutomationExtension', False)

try:
    driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=options)
    driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
    print("✅ Chrome iniciado correctamente")
except Exception as e:
    print(f"❌ Error al iniciar Chrome: {e}")
    print("💡 Asegúrate de que Google Chrome esté instalado")
    exit(1)

def get_max_pages():
    """Detectar el número máximo de páginas"""
    try:
        # Esperar a que cargue completamente
        time.sleep(5)
        
        # Obtener el HTML para análisis
        html = driver.page_source
        soup = BeautifulSoup(html, "html.parser")
        
        print("🔍 Buscando elementos de paginación...")
        
        # Múltiples estrategias para encontrar paginación
        selectors_to_try = [
            ".page-numbers",
            ".pagination",
            ".paging", 
            ".nav-links",
            "[class*='page']",
            "[class*='pagination']",
            ".elementor-pagination",
            ".woocommerce-pagination",
            ".wp-pagenavi"
        ]
        
        pagination_element = None
        for selector in selectors_to_try:
            elements = soup.select(selector)
            if elements:
                pagination_element = elements[0]
                print(f"✅ Encontrado contenedor de paginación con: {selector}")
                break
        
        if not pagination_element:
            print("⚠️ No se encontró contenedor de paginación, buscando números directamente...")
            # Buscar números en el HTML
            import re
            numbers = re.findall(r'\b(1[0-2]|[2-9])\b', str(soup))
            if numbers:
                max_page = max([int(n) for n in numbers if int(n) <= 20])  # Limitar a 20 páginas máx
                print(f"📄 Detectadas posiblemente {max_page} páginas por análisis de números")
                return max_page
        else:
            # Buscar números en el elemento de paginación
            links = pagination_element.find_all(['a', 'span', 'button'])
            max_page = 1
            
            for link in links:
                text = link.get_text(strip=True)
                try:
                    page_num = int(text)
                    if 1 <= page_num <= 50:  # Rango razonable
                        if page_num > max_page:
                            max_page = page_num
                            print(f"   Encontrada página: {page_num}")
                except (ValueError, TypeError):
                    continue
            
            print(f"📄 Se detectaron {max_page} páginas")
            return max_page
        
        # Si nada funciona, intentar con Selenium
        print("🔍 Intentando detección con Selenium...")
        try:
            pagination_elements = driver.find_elements(By.XPATH, "//*[contains(text(), '10') or contains(text(), '11') or contains(text(), '12')]")
            page_numbers = []
            for elem in pagination_elements:
                try:
                    num = int(elem.text.strip())
                    if 1 <= num <= 20:
                        page_numbers.append(num)
                except:
                    continue
            
            if page_numbers:
                max_page = max(page_numbers)
                print(f"📄 Selenium detectó {max_page} páginas")
                return max_page
        except Exception as e:
            print(f"⚠️ Error con Selenium: {e}")
        
        # Como último recurso, probar páginas manualmente
        print("🧪 Probando páginas manualmente...")
        for test_page in [12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2]:
            test_url = f"{BASE_URL}page/{test_page}/"
            try:
                driver.get(test_url)
                time.sleep(2)
                
                # Verificar si la página existe (no es 404 o redirect)
                current_url = driver.current_url
                if f"page/{test_page}" in current_url:
                    print(f"📄 Página {test_page} existe, usando como máximo")
                    return test_page
            except:
                continue
        
        print("📄 Solo se detectó 1 página")
        return 1
        
    except Exception as e:
        print(f"⚠️ Error detectando páginas: {e}")
        return 1

def process_page(page_num, img_counter):
    """Procesar una página específica"""
    print(f"\n🔍 Procesando página {page_num}...")
    
    # Construir URL de la página
    if page_num == 1:
        url = BASE_URL
    else:
        url = f"{BASE_URL}page/{page_num}/"
    
    print(f"🌐 Cargando: {url}")
    driver.get(url)
    time.sleep(3)  # Esperar a que cargue
    
    # Obtener HTML y parsearlo
    html = driver.page_source
    soup = BeautifulSoup(html, "html.parser")
    
    # Buscar productos (usando la lógica del script anterior)
    cards = soup.select(".card")
    if len(cards) == 0:
        alternative_selectors = [
            ".product-item", ".item", ".product", ".grid-item", 
            ".catalog-item", ".producto", "[class*='product']",
            "[class*='item']", ".card-product", ".product-card"
        ]
        
        for selector in alternative_selectors:
            elements = soup.select(selector)
            if len(elements) > 0:
                print(f"✅ Página {page_num}: Encontrados {len(elements)} productos con selector: {selector}")
                cards = elements
                break
    else:
        print(f"✅ Página {page_num}: Encontrados {len(cards)} productos con selector: .card")
    
    page_products = 0
    for idx, card in enumerate(cards):
        img = card.find("img")
        if not img or not img.get("src"):
            continue
        
        img_url = img["src"]
        # Asegurar URL completa
        if img_url.startswith("//"):
            img_url = "https:" + img_url
        elif img_url.startswith("/"):
            img_url = "https://andet.com.pe" + img_url
        
        try:
            response = requests.get(img_url, timeout=10)
            response.raise_for_status()
            img_data = response.content
            img_name = f"img_{img_counter:03d}_p{page_num}_{idx+1:02d}.jpg"
            
            with open(os.path.join(FOLDER, img_name), "wb") as f:
                f.write(img_data)
            
            desc = img.get("alt") or img.get("title") or ""
            text_near = card.get_text(strip=True).replace("\n", " ")
            
            # Obtener estilos
            try:
                all_imgs = driver.find_elements(By.CSS_SELECTOR, "img")
                if idx < len(all_imgs):
                    img_element = all_imgs[idx]
                    styles = driver.execute_script(
                        """
                        const s = window.getComputedStyle(arguments[0]);
                        return Object.fromEntries(Array.from(s).map(p => [p, s.getPropertyValue(p)]));
                        """, img_element
                    )
                else:
                    styles = {}
            except Exception as e:
                styles = {}
            
            # Guardar en archivo con información de página
            with open(os.path.join(FOLDER, "data_completo.txt"), "a", encoding="utf-8") as out:
                out.write(f"{img_name}\tPágina {page_num}\t{desc}\t{text_near}\t{json.dumps(styles)}\n")
            
            print(f"   ✅ Guardado: {img_name}")
            img_counter += 1
            page_products += 1
            
        except Exception as e:
            print(f"   ⚠️ Error descargando imagen {idx+1} de página {page_num}: {e}")
            continue
    
    print(f"📊 Página {page_num}: {page_products} productos guardados")
    return img_counter

# Función principal
def main():
    total_images = 0
    
    # Ir a la primera página para detectar paginación
    print("🌐 Cargando página principal para detectar paginación...")
    driver.get(BASE_URL)
    time.sleep(3)
    
    # Detectar número máximo de páginas
    max_pages = get_max_pages()
    
    # Si solo detecta 1 página, usar el número forzado
    if max_pages == 1 and FORCE_PAGES > 1:
        print(f"🔧 Detección automática falló, usando {FORCE_PAGES} páginas forzadas")
        max_pages = FORCE_PAGES
    
    # Crear archivo de datos limpio
    with open(os.path.join(FOLDER, "data_completo.txt"), "w", encoding="utf-8") as out:
        out.write("imagen\tpagina\tdescripcion\ttexto\testilos\n")
    
    img_counter = 1
    
    # Procesar cada página
    for page in range(1, max_pages + 1):
        try:
            img_counter = process_page(page, img_counter)
        except Exception as e:
            print(f"❌ Error procesando página {page}: {e}")
            continue
    
    # Extraer estilos completos de la última página cargada
    print("\n🔍 Extrayendo estilos CSS completos...")
    try:
        all_styles = driver.execute_script("""
            const results = [];
            const all = document.querySelectorAll("*");

            for (let el of all) {
                const styles = window.getComputedStyle(el);
                const styleObj = {};
                for (let i = 0; i < styles.length; i++) {
                    const prop = styles[i];
                    styleObj[prop] = styles.getPropertyValue(prop);
                }
                results.push({
                    tag: el.tagName,
                    classes: Array.from(el.classList),
                    id: el.id,
                    xpath: getXPath(el),
                    styles: styleObj
                });
            }

            function getXPath(el) {
                if (el.id) return `//*[@id="${el.id}"]`;
                const parts = [];
                while (el && el.nodeType === Node.ELEMENT_NODE) {
                    let ix = 0;
                    let sib = el.previousSibling;
                    while (sib) {
                        if (sib.nodeType === Node.ELEMENT_NODE && sib.tagName === el.tagName) {
                            ix++;
                        }
                        sib = sib.previousSibling;
                    }
                    const tagName = el.tagName.toLowerCase();
                    const pathIndex = ix ? `[${ix+1}]` : "";
                    parts.unshift(`${tagName}${pathIndex}`);
                    el = el.parentNode;
                }
                return "/" + parts.join("/");
            }

            return results;
        """)

        with open(os.path.join(FOLDER, "estilos_completos.json"), "w", encoding="utf-8") as f:
            json.dump(all_styles, f, ensure_ascii=False, indent=2)
        
        print(f"📁 Estilos guardados en {FOLDER}/estilos_completos.json")
    except Exception as e:
        print(f"⚠️ Error al extraer estilos: {e}")

    driver.quit()
    
    # Mostrar estadísticas finales
    total_images = img_counter - 1
    print(f"\n🎉 ¡Proceso completo!")
    print(f"📊 Total de páginas procesadas: {max_pages}")
    print(f"📸 Total de imágenes descargadas: {total_images}")
    print(f"📁 Archivos guardados en: {FOLDER}/")

if __name__ == "__main__":
    main()
