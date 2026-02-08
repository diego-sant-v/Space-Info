# 🚀 Space Info - Explorador do Universo

<img src="https://dasartes.com.br/dasartes.com.br/wp-content/uploads/2022/07/main_image_star-forming_region_carina_nircam_final-5mb-1024x593-1.jpeg">

Bem-vindo ao **Space Info**! Uma aplicação Angular moderna e interativa que consome as APIs da NASA para explorar o universo. Descubra imagens astronômicas, asteroides próximos da Terra, fotos do rover Curiosity em Marte e muito mais!

## ✨ Funcionalidades

### 🏠 Página Inicial - Imagem Astronômica do Dia
- Visualize a imagem astronômica do dia (APOD - Astronomy Picture of the Day)
- Selecione qualquer data desde 16/06/1995 para ver imagens históricas
- Suporte para imagens e vídeos
- Visualização em alta resolução
- Informações detalhadas e copyright dos autores
- **Formato de data em português (dd/MM/yyyy)**

### ☄️ Asteroides Próximos da Terra
- Busque asteroides que passaram perto da Terra em qualquer período (até 7 dias)
- Visualize informações detalhadas:
  - Nome e magnitude do asteroide
  - Dimensões estimadas
  - Distância de aproximação
  - Velocidade relativa
  - Status de periculosidade
  - Links para NASA JPL para mais detalhes
- Cards responsivos com indicadores visuais de asteroides perigosos
- **Datas formatadas em português**

### 🤖 Curiosity Rover - Explorer de Marte
- Modelo 3D interativo do rover Curiosity
- Busque fotos por data e câmera específica
- 7 câmeras diferentes disponíveis:
  - FHAZ - Câmera Frontal
  - RHAZ - Câmera Traseira
  - MAST - Câmera do Mastro
  - CHEMCAM - Câmera Química
  - MAHLI - Lente de Mão
  - MARDI - Descida
  - NAVCAM - Navegação
- **Dicas sobre quais câmeras têm mais fotos disponíveis**
- Visualização em galeria com informações de cada foto
- Links para imagens em tamanho real
- **Feedback melhorado quando não há fotos**

### 🌍 Nosso Planeta Terra
- **12 dados fascinantes sobre a Terra** (idade, diâmetro, massa, etc.)
- **Estrutura interna completa** - 5 camadas da Terra explicadas
- **10+ curiosidades interessantes** sobre nosso planeta
- Imagem icônica "The Blue Marble" da Apollo 17
- **Mensagem de conscientização ambiental**
- Design totalmente responsivo

### 🛰️ EPIC - Terra do Espaço (NOVO!)
- **Earth Polychromatic Imaging Camera**
- Fotos em cores naturais da Terra capturadas do espaço
- Imagens tiradas do satélite DSCOVR a 1,5 milhão de km de distância
- **Ver imagens mais recentes ou buscar por data específica**
- Disponível desde 01/10/2015
- Informações de cada imagem:
  - Data e hora da captura
  - Coordenadas do ponto central
  - Região/continente visível
- **Visualização em galeria com imagens em alta qualidade**
- Atualizado a cada 1-2 horas com novas imagens

## 🎨 Design e UX

### Tema Espacial
- Paleta de cores inspirada no espaço profundo
- Gradientes nebulosos e efeitos de brilho
- Animações suaves e transições elegantes
- Ícones emoji temáticos para melhor visualização

### Responsividade
- ✅ Desktop (1920px+)
- ✅ Laptop (1366px - 1919px)
- ✅ Tablet (768px - 1365px)
- ✅ Mobile (320px - 767px)
- Grid system adaptativo
- Imagens otimizadas com lazy loading

### Estados de Interface
- **Loading States**: Spinners com mensagens contextuais
- **Empty States**: Mensagens amigáveis incentivando a exploração
- **Error States**: Mensagens claras com opções de retry
- **Success States**: Confirmações visuais e contadores

### Validações e Feedback
- Validação de datas em todos os formulários
- Limites de período (7 dias para asteroides)
- Mensagens de erro descritivas via snackbar
- Confirmações de sucesso com contador de resultados
- Desabilitação de botões durante loading

## 🛠️ Tecnologias Utilizadas

- **Angular 16.2.0**
- **Angular Material** - Componentes de UI
- **Bootstrap 5.3.1** - Grid system
- **RxJS 7.8.0** - Programação reativa
- **TypeScript 5.1.3**
- **SCSS** - Estilos avançados

## 📦 Instalação

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/space-info.git

# Entre na pasta do projeto
cd space-info

# Instale as dependências
npm install

# Inicie o servidor de desenvolvimento
npm start
```

O aplicativo estará disponível em `http://localhost:4200/`

## 🚀 Scripts Disponíveis

```bash
npm start          # Inicia o servidor de desenvolvimento
npm run build      # Build de produção
npm test           # Executa os testes
npm run watch      # Build em modo watch
npm run deploy:ghdocs  # Deploy para GitHub Pages
```

## 🌐 APIs Utilizadas

Este projeto consome as seguintes APIs da NASA:

- **APOD API** - Astronomy Picture of the Day
  - Imagens astronômicas diárias desde 1995
  - https://api.nasa.gov/planetary/apod

- **NeoWs API** - Near Earth Object Web Service
  - Dados de asteroides próximos da Terra
  - https://api.nasa.gov/neo/rest/v1/feed

- **Mars Rover Photos API** - Fotos do rover Curiosity
  - Imagens de Marte capturadas por 7 câmeras diferentes
  - https://api.nasa.gov/mars-photos/api/v1/rovers/curiosity/photos

- **EPIC API** - Earth Polychromatic Imaging Camera (NOVO!)
  - Fotos da Terra do espaço em cores naturais
  - Atualizadas a cada 1-2 horas
  - https://api.nasa.gov/EPIC

> **Nota**: Uma chave de API da NASA é necessária. A chave demo está incluída mas tem limite de requisições. Para uso extensivo, obtenha sua chave gratuita em [NASA API Portal](https://api.nasa.gov/)

## 📱 Recursos de Acessibilidade

- Labels descritivos em todos os campos
- Contraste adequado de cores
- Navegação por teclado
- Hints informativos
- Feedback visual claro
- Mensagens de erro acessíveis

## 🎯 Melhorias Implementadas

✅ Tema espacial completo com gradientes e animações  
✅ Navbar responsiva com indicadores de rota ativa  
✅ Empty states em todos os componentes  
✅ Loading states com mensagens contextuais  
✅ Error handling robusto em todos os serviços  
✅ Validações de formulário abrangentes  
✅ Mensagens de erro amigáveis  
✅ Responsividade total (mobile-first)  
✅ Componente Terra completamente implementado  
✅ Tratamento de erros HTTP com RxJS operators  
✅ Snackbar para feedback do usuário  
✅ Animações CSS customizadas  
✅ Cards modernos com hover effects  
✅ Otimização de imagens com lazy loading  

## 📄 Licença

Este projeto foi gerado com [Angular CLI](https://github.com/angular/angular-cli) versão 16.2.1.

---
Desenvolvido por: Diego Sousa
Feito com 💜 e ☕ para explorar o universo!