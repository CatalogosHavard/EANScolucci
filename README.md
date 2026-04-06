# Generador de Códigos EAN

Plataforma web para generar y gestionar códigos EAN-13 de forma automática con persistencia de datos en el navegador.

## 🚀 Características

- **Generación automática de EANs**: Crea códigos EAN-13 válidos basados en un prefijo/marca
- **Cálculo automático del dígito de control**: Asegura que todos los códigos sean válidos
- **Base manual**: Carga parcialmente un código y autocompleta el resto
- **Blacklist de códigos**: Marca códigos usados o no válidos para evitar duplicados
- **Historial completo**: Guarda todos los códigos generados con fecha y detalles
- **Persistencia local**: Todos los datos se guardan en el navegador (localStorage)
- **Exportar/Importar**: Backup y restauración de datos en formato JSON
- **Sin servidor necesario**: Funciona 100% en el navegador (GitHub Pages compatible)

## 📋 Cómo funciona

### Estructura de un código EAN-13

Un código EAN-13 tiene 13 dígitos con la siguiente estructura:
- **Prefijo GS1** (3 dígitos): Código del país
- **Código de empresa** (variable): Asignado por GS1
- **Código de producto** (variable): Asignado por la empresa
- **Dígito de control** (1 dígito): Calculado automáticamente

Ejemplo: `7791234567890`
- `779`: Prefijo de Argentina
- `1234567890`: Base (empresa + producto)
- `0`: Dígito de control calculado

### Funcionalidades principales

1. **Configurar marca/prefijo**: 
   - Ingresa el prefijo base de tu empresa (ej: `779123`)
   - La app generará códigos secuenciales a partir de esta base

2. **Base manual**:
   - Ingresa manualmente los primeros dígitos de un código
   - Presiona "Autocompletar" para completar hasta 12 dígitos
   - El dígito de control se calcula automáticamente

3. **Generar códigos**:
   - Presiona "Generar Nuevo EAN"
   - Se crea un código único que no esté en la blacklist ni duplicado
   - Se incrementa el contador automáticamente

4. **Blacklist**:
   - Agrega códigos que ya están en uso o no son válidos
   - Los códigos en blacklist no se generarán nuevamente
   - Valida automáticamente el dígito de control

5. **Exportar/Importar**:
   - Exporta todos tus datos en un archivo JSON
   - Importa datos desde un backup anterior
   - Útil para cambiar de dispositivo o hacer respaldo

## 🌐 Deploy en GitHub Pages

### Opción 1: Subir directamente

1. Crea un nuevo repositorio en GitHub
2. Sube el archivo `index.html` al repositorio
3. Ve a Settings → Pages
4. En "Source", selecciona la rama `main` y la carpeta `/ (root)`
5. Guarda y espera unos minutos
6. Tu sitio estará disponible en `https://tu-usuario.github.io/nombre-repo/`

### Opción 2: Usar GitHub Desktop

1. Crea un nuevo repositorio en GitHub
2. Clónalo con GitHub Desktop
3. Copia el archivo `index.html` a la carpeta del repositorio
4. Haz commit y push
5. Activa GitHub Pages en la configuración del repositorio

### Opción 3: Desde la terminal

```bash
# Crear un nuevo repositorio local
mkdir ean-generator
cd ean-generator
git init

# Copiar el archivo index.html aquí

# Hacer commit
git add index.html
git commit -m "Initial commit: EAN Generator"

# Conectar con GitHub
git remote add origin https://github.com/tu-usuario/ean-generator.git
git branch -M main
git push -u origin main

# Activar GitHub Pages desde la web de GitHub
```

## 💾 Estructura de datos

Los datos se guardan en localStorage con la siguiente estructura:

```json
{
  "marca": "779123",
  "contador": 42,
  "eansGenerados": [
    {
      "codigo": "7791234567890",
      "fecha": "2026-04-06T10:30:00.000Z",
      "base": "779123",
      "secuencia": 42
    }
  ],
  "blacklist": [
    "7791234567891",
    "7791234567892"
  ]
}
```

## 🔐 Seguridad y privacidad

- Todos los datos se almacenan **localmente en tu navegador**
- No se envía ninguna información a servidores externos
- Los datos persisten entre sesiones
- Haz backups regulares usando la función "Exportar Datos"

## 🛠️ Tecnologías utilizadas

- React 18 (vía CDN)
- Tailwind CSS (vía CDN)
- LocalStorage API
- Babel Standalone (transformación JSX)
- Vanilla JavaScript

## 📱 Compatibilidad

- ✅ Chrome, Edge, Firefox, Safari (versiones modernas)
- ✅ Dispositivos móviles (iOS, Android)
- ✅ Funciona offline después de la primera carga

## 🐛 Solución de problemas

### Los datos no se guardan
- Verifica que tu navegador permita localStorage
- Revisa que no estés en modo incógnito/privado

### Los códigos generados no son válidos
- El algoritmo de dígito de control está implementado según el estándar EAN-13
- Puedes verificar los códigos en https://www.gs1.org/services/check-digit-calculator

### La página no se ve bien
- Asegúrate de tener conexión a internet la primera vez (para cargar Tailwind CSS)
- Prueba limpiar la caché del navegador

## 📄 Licencia

Este proyecto está disponible para uso personal y comercial. Siéntete libre de modificarlo según tus necesidades.

## 🤝 Contribuciones

Si encuentras algún error o tienes sugerencias de mejora, no dudes en:
- Abrir un issue en GitHub
- Hacer un fork y enviar un pull request
- Contactarme directamente

---

**Nota**: Este generador crea códigos EAN-13 válidos desde el punto de vista matemático (dígito de control correcto), pero para uso comercial oficial necesitas registrar tu prefijo de empresa con GS1 Argentina (o tu país correspondiente).
