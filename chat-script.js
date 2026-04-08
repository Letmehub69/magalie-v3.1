// Script pour la page sur les chats

// Menu mobile
document.addEventListener('DOMContentLoaded', function() {
    const menuToggle = document.querySelector('.menu-toggle');
    const navLinks = document.querySelector('.nav-links');
    
    if (menuToggle) {
        menuToggle.addEventListener('click', function() {
            navLinks.classList.toggle('active');
        });
    }
    
    // Fermer le menu en cliquant sur un lien
    const links = document.querySelectorAll('.nav-links a');
    links.forEach(link => {
        link.addEventListener('click', function() {
            navLinks.classList.remove('active');
        });
    });
    
    // Animation au défilement
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animated');
            }
        });
    }, observerOptions);
    
    // Observer les sections
    const sections = document.querySelectorAll('.section');
    sections.forEach(section => {
        observer.observe(section);
    });
    
    // Initialiser le compteur de chats
    updateCatCounter();
});

// Fonction pour faire défiler vers une section
function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
    }
}

// Fonction pour charger plus de chats
function loadMoreCats() {
    const gallery = document.querySelector('.gallery');
    const loadMoreButton = document.querySelector('.load-more');
    
    // Emojis de chats supplémentaires
    const moreCats = [
        { emoji: '🐱', name: 'Chat mignon' },
        { emoji: '🙀', name: 'Chat surpris' },
        { emoji: '😿', name: 'Chat triste' },
        { emoji: '😾', name: 'Chat grincheux' },
        { emoji: '🐈‍⬛', name: 'Chat noir' },
        { emoji: '🦁', name: 'Lion (chat géant!)' }
    ];
    
    // Ajouter les nouveaux chats
    moreCats.forEach(cat => {
        const catElement = document.createElement('div');
        catElement.className = 'gallery-item';
        catElement.setAttribute('data-cat', cat.name);
        
        catElement.innerHTML = `
            <div class="gallery-img placeholder">${cat.emoji}</div>
            <p>${cat.name}</p>
        `;
        
        gallery.appendChild(catElement);
    });
    
    // Mettre à jour le compteur
    updateCatCounter();
    
    // Désactiver le bouton après avoir tout chargé
    loadMoreButton.textContent = 'Tous les chats chargés!';
    loadMoreButton.disabled = true;
    loadMoreButton.style.opacity = '0.6';
    loadMoreButton.style.cursor = 'default';
}

// Fonction pour mettre à jour le compteur de chats
function updateCatCounter() {
    const catCount = document.querySelectorAll('.gallery-item').length;
    const counterElement = document.getElementById('cat-counter') || createCounterElement();
    
    counterElement.textContent = `(${catCount} chats affichés)`;
}

// Créer l'élément compteur s'il n'existe pas
function createCounterElement() {
    const gallerySection = document.querySelector('#galerie');
    const title = gallerySection.querySelector('h2');
    
    const counterElement = document.createElement('span');
    counterElement.id = 'cat-counter';
    counterElement.style.fontSize = '1rem';
    counterElement.style.color = '#666';
    counterElement.style.marginLeft = '10px';
    counterElement.style.fontWeight = 'normal';
    
    title.appendChild(counterElement);
    return counterElement;
}

// Fonction pour soumettre le formulaire
function submitForm(event) {
    event.preventDefault();
    
    const form = event.target;
    const formData = new FormData(form);
    const name = formData.get('name') || form.querySelector('input[type="text"]').value;
    
    // Simulation d'envoi
    const submitButton = form.querySelector('button[type="submit"]');
    const originalText = submitButton.innerHTML;
    
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Envoi en cours...';
    submitButton.disabled = true;
    
    // Simuler un délai d'envoi
    setTimeout(() => {
        alert(`Merci ${name || 'cher visiteur'}! Votre message a été envoyé. Nous vous répondrons bientôt.`);
        
        // Réinitialiser le formulaire
        form.reset();
        
        // Réactiver le bouton
        submitButton.innerHTML = originalText;
        submitButton.disabled = false;
    }, 1500);
}

// Fonction pour changer le thème (clair/sombre)
function toggleTheme() {
    const body = document.body;
    const currentTheme = body.getAttribute('data-theme');
    
    if (currentTheme === 'dark') {
        body.removeAttribute('data-theme');
        localStorage.setItem('cat-theme', 'light');
    } else {
        body.setAttribute('data-theme', 'dark');
        localStorage.setItem('cat-theme', 'dark');
    }
}

// Charger le thème sauvegardé
function loadTheme() {
    const savedTheme = localStorage.getItem('cat-theme');
    if (savedTheme === 'dark') {
        document.body.setAttribute('data-theme', 'dark');
    }
}

// Ajouter un bouton de changement de thème
function addThemeToggle() {
    const header = document.querySelector('header');
    const themeToggle = document.createElement('button');
    
    themeToggle.id = 'theme-toggle';
    themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
    themeToggle.title = 'Changer le thème';
    themeToggle.style.background = 'none';
    themeToggle.style.border = 'none';
    themeToggle.style.fontSize = '1.2rem';
    themeToggle.style.cursor = 'pointer';
    themeToggle.style.color = '#333';
    themeToggle.style.marginLeft = '1rem';
    
    themeToggle.addEventListener('click', toggleTheme);
    
    // Ajouter au header
    const navbar = document.querySelector('.navbar');
    navbar.appendChild(themeToggle);
}

// Initialiser le thème
loadTheme();
addThemeToggle();

// Animation aléatoire des emojis de chats
function animateCatEmojis() {
    const catEmojis = document.querySelectorAll('.gallery-img.placeholder');
    
    catEmojis.forEach(emoji => {
        // Animation aléatoire
        const randomDelay = Math.random() * 2;
        const randomDuration = 1 + Math.random() * 2;
        
        emoji.style.animation = `float ${randomDuration}s ease-in-out ${randomDelay}s infinite`;
    });
}

// Démarrer les animations
setTimeout(animateCatEmojis, 1000);

// Ajouter un effet de confettis pour célébrer les chats
function celebrateCats() {
    const celebrationButton = document.createElement('button');
    celebrationButton.textContent = '🎉 Célébrer les chats!';
    celebrationButton.style.position = 'fixed';
    celebrationButton.style.bottom = '20px';
    celebrationButton.style.right = '20px';
    celebrationButton.style.zIndex = '1000';
    celebrationButton.style.background = '#ff7b54';
    celebrationButton.style.color = 'white';
    celebrationButton.style.border = 'none';
    celebrationButton.style.padding = '10px 15px';
    celebrationButton.style.borderRadius = '20px';
    celebrationButton.style.cursor = 'pointer';
    celebrationButton.style.fontWeight = 'bold';
    celebrationButton.style.boxShadow = '0 3px 10px rgba(0,0,0,0.2)';
    
    celebrationButton.addEventListener('click', function() {
        alert('🎊 Hourra pour les chats! 🐱\n\nLes chats sont les meilleurs animaux de compagnie!');
        
        // Effet visuel simple
        this.style.transform = 'scale(1.1)';
        this.style.background = '#ffd166';
        setTimeout(() => {
            this.style.transform = 'scale(1)';
            this.style.background = '#ff7b54';
        }, 300);
    });
    
    document.body.appendChild(celebrationButton);
}

// Ajouter le bouton de célébration
setTimeout(celebrateCats, 2000);