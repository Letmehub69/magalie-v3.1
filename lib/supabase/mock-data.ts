// Données mockées pour le développement local sans Docker

export const mockProfiles = [
  {
    id: 'user-123',
    email: 'test@example.com',
    full_name: 'Utilisateur Test',
    role: 'parent',
    avatar_url: null,
    created_at: '2024-01-01T10:00:00Z',
    updated_at: '2024-01-01T10:00:00Z',
  },
  {
    id: 'user-456',
    email: 'avocat@example.com',
    full_name: 'Maître Tremblay',
    role: 'avocat',
    avatar_url: null,
    created_at: '2024-01-01T10:00:00Z',
    updated_at: '2024-01-01T10:00:00Z',
  },
]

export const mockDossiers = [
  {
    id: '1',
    titre: 'Dossier Tremblay - Garde d\'enfants',
    description: 'Demande de garde exclusive suite à aliénation parentale',
    type: 'familial',
    statut: 'actif',
    priority: 'high',
    dossier_number: 'FAM-2024-001',
    created_by: 'user-123',
    avocat_id: 'user-456',
    client_id: 'user-123',
    date_ouverture: '2024-01-15T00:00:00Z',
    date_cloture: null,
    tags: ['garde', 'aliénation', 'enfants'],
    access_level: 'private',
    confidential: true,
    created_at: '2024-01-15T10:30:00Z',
    updated_at: '2024-01-15T10:30:00Z',
  },
  {
    id: '2',
    titre: 'Dossier Martin - Pension alimentaire',
    description: 'Recalcul de pension suite à changement de revenus',
    type: 'familial',
    statut: 'en_cours',
    priority: 'medium',
    dossier_number: 'FAM-2024-002',
    created_by: 'user-123',
    avocat_id: null,
    client_id: 'user-123',
    date_ouverture: '2024-01-10T00:00:00Z',
    date_cloture: null,
    tags: ['pension', 'revenus', 'calcul'],
    access_level: 'private',
    confidential: false,
    created_at: '2024-01-10T14:20:00Z',
    updated_at: '2024-01-10T14:20:00Z',
  },
  {
    id: '3',
    titre: 'Dossier Dubois - Signalement DPJ',
    description: 'Signalement pour négligence parentale',
    type: 'administratif',
    statut: 'ouvert',
    priority: 'urgent',
    dossier_number: 'ADM-2024-001',
    created_by: 'user-123',
    avocat_id: null,
    client_id: 'user-123',
    date_ouverture: '2024-01-05T00:00:00Z',
    date_cloture: null,
    tags: ['dpj', 'signalement', 'négligence'],
    access_level: 'private',
    confidential: true,
    created_at: '2024-01-05T09:15:00Z',
    updated_at: '2024-01-05T09:15:00Z',
  },
]

export const mockDocuments = [
  {
    id: 'doc-1',
    dossier_id: '1',
    titre: 'Déclaration sous serment',
    description: 'Déclaration détaillant les incidents d\'aliénation',
    type: 'declaration',
    file_path: 'documents/1/declaration.pdf',
    file_size: 2456789,
    mime_type: 'application/pdf',
    uploaded_by: 'user-123',
    uploaded_at: '2024-01-16T11:00:00Z',
    created_at: '2024-01-16T11:00:00Z',
  },
  {
    id: 'doc-2',
    dossier_id: '1',
    titre: 'Photos des messages',
    description: 'Captures d\'écran des messages inappropriés',
    type: 'preuve',
    file_path: 'documents/1/messages.zip',
    file_size: 1234567,
    mime_type: 'application/zip',
    uploaded_by: 'user-123',
    uploaded_at: '2024-01-16T14:30:00Z',
    created_at: '2024-01-16T14:30:00Z',
  },
  {
    id: 'doc-3',
    dossier_id: '2',
    titre: 'Relevés de paie',
    description: 'Relevés des 6 derniers mois',
    type: 'financier',
    file_path: 'documents/2/paies.pdf',
    file_size: 3456789,
    mime_type: 'application/pdf',
    uploaded_by: 'user-123',
    uploaded_at: '2024-01-11T09:15:00Z',
    created_at: '2024-01-11T09:15:00Z',
  },
]

export const mockJournalEntries = [
  {
    id: 'journal-1',
    dossier_id: '1',
    parent_id: 'user-123',
    date_incident: '2024-01-10T15:30:00Z',
    type: 'incident',
    titre: 'Refus de visite',
    description: 'L\'autre parent a refusé la visite hebdomadaire sans raison valable',
    emotion: 'frustration',
    impact: 'moyen',
    created_at: '2024-01-10T16:00:00Z',
  },
  {
    id: 'journal-2',
    dossier_id: '1',
    parent_id: 'user-123',
    date_incident: '2024-01-12T10:00:00Z',
    type: 'communication',
    titre: 'Message dénigrant',
    description: 'Message reçu dénigrant devant l\'enfant',
    emotion: 'colère',
    impact: 'élevé',
    created_at: '2024-01-12T10:30:00Z',
  },
  {
    id: 'journal-3',
    dossier_id: '2',
    parent_id: 'user-123',
    date_incident: '2024-01-09T14:00:00Z',
    type: 'financier',
    titre: 'Changement d\'emploi',
    description: 'L\'autre parent a changé d\'emploi avec augmentation de salaire',
    emotion: 'inquiétude',
    impact: 'élevé',
    created_at: '2024-01-09T14:30:00Z',
  },
]

export const mockChatMessages = [
  {
    id: 'chat-1',
    dossier_id: '1',
    sender_id: 'user-123',
    recipient_id: 'user-456',
    content: 'Bonjour Maître, j\'ai reçu de nouveaux messages inquiétants.',
    sent_at: '2024-01-16T09:00:00Z',
    read: true,
  },
  {
    id: 'chat-2',
    dossier_id: '1',
    sender_id: 'user-456',
    recipient_id: 'user-123',
    content: 'Bonjour, pouvez-vous les télécharger dans le dossier ? Je les analyserai.',
    sent_at: '2024-01-16T09:15:00Z',
    read: true,
  },
  {
    id: 'chat-3',
    dossier_id: '1',
    sender_id: 'user-123',
    recipient_id: 'user-456',
    content: 'C\'est fait. J\'ai ajouté les captures d\'écran.',
    sent_at: '2024-01-16T14:35:00Z',
    read: false,
  },
]

export const mockTemplates = [
  {
    id: 'template-1',
    titre: 'Lettre de signalement DPJ',
    description: 'Modèle de lettre pour signaler une situation à la DPJ',
    type: 'lettre',
    content: '# Lettre de signalement DPJ\n\n[Votre nom]\n[Votre adresse]\n[Votre téléphone]\n[Votre email]\n\n[Date]\n\nDirection de la protection de la jeunesse\n[Adresse de la DPJ]\n\nObjet : Signalement d\'une situation compromettant la sécurité ou le développement d\'un enfant\n\nMadame, Monsieur,\n\nJe soussigné(e) [Votre nom], parent de [Nom de l\'enfant], né(e) le [Date de naissance], vous informe par la présente d\'une situation qui compromet, selon moi, la sécurité ou le développement de mon enfant.\n\n[Description détaillée des faits et des inquiétudes]\n\n[Date et lieu des incidents]\n\n[Personnes impliquées]\n\n[Éléments de preuve disponibles]\n\nJe vous prie de bien vouloir prendre les mesures nécessaires pour assurer la protection de mon enfant.\n\nDans l\'attente de votre intervention, je vous prie d\'agréer, Madame, Monsieur, l\'expression de mes salutations distinguées.\n\n[Signature]',
    tags: ['dpj', 'signalement', 'protection'],
    public: true,
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'template-2',
    titre: 'Journal des incidents',
    description: 'Modèle pour documenter les incidents dans un journal',
    type: 'journal',
    content: '# Journal des incidents\n\n## Date : [Date de l\'incident]\n## Heure : [Heure de l\'incident]\n## Type : [Type d\'incident]\n\n### Description :\n[Description détaillée de ce qui s\'est passé]\n\n### Personnes présentes :\n[Liste des personnes présentes]\n\n### Éléments de preuve :\n[Liste des preuves disponibles]\n\n### Impact émotionnel :\n[Description de l\'impact sur l\'enfant et vous]\n\n### Actions prises :\n[Actions que vous avez prises]\n\n### Prochaines étapes :\n[Ce que vous prévoyez de faire]',
    tags: ['journal', 'documentation', 'preuve'],
    public: true,
    created_at: '2024-01-01T00:00:00Z',
  },
]

export const mockResources = [
  {
    id: 'resource-1',
    titre: 'Code civil du Québec - Livre 2',
    description: 'Livre 2 du Code civil du Québec concernant la famille',
    type: 'loi',
    url: 'https://www.legisquebec.gouv.qc.ca/fr/document/lc/CCQ-1991',
    tags: ['code civil', 'famille', 'loi'],
    verified: true,
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'resource-2',
    titre: 'Loi sur la protection de la jeunesse',
    description: 'Loi complète sur la protection de la jeunesse',
    type: 'loi',
    url: 'https://www.legisquebec.gouv.qc.ca/fr/document/lc/P-34.1',
    tags: ['lpj', 'protection', 'jeunesse'],
    verified: true,
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'resource-3',
    titre: 'Guide des droits des parents',
    description: 'Guide complet des droits des parents au Québec',
    type: 'guide',
    url: 'https://www.justice.gouv.qc.ca/fr/droits-de-la-personne/droits-des-parents/',
    tags: ['guide', 'droits', 'parents'],
    verified: true,
    created_at: '2024-01-01T00:00:00Z',
  },
]

// Fonction pour simuler un délai réseau
export const simulateNetworkDelay = (ms: number = 300) => {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// Vérifier si nous sommes en mode développement sans Docker
export const isMockMode = () => {
  return process.env.NODE_ENV === 'development' && 
         process.env.NEXT_PUBLIC_USE_MOCK_AI === 'true' &&
         !process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('supabase.co')
}