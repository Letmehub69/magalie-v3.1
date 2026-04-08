// AI Client for JuriPlateforme
// Uses Claude 3.5 Sonnet for legal analysis

interface AIRequest {
  prompt: string
  context?: {
    documents?: any[]
    journalEntries?: any[]
    dossier?: any
    userRole?: string
  }
  model?: 'claude-3-5-sonnet' | 'claude-3-haiku' | 'gpt-4' | 'gpt-3.5-turbo'
  temperature?: number
  maxTokens?: number
}

interface AIResponse {
  content: string
  model: string
  tokens: number
  cost: number
  citations?: string[]
}

// Mock AI client for development
// In production, replace with actual API calls

export class AIClient {
  private apiKey: string | null = null
  private baseUrl = 'https://api.anthropic.com/v1'
  
  constructor() {
    // In development, use mock responses
    // In production, load from environment variable
    this.apiKey = process.env.ANTHROPIC_API_KEY || null
  }
  
  async analyzeDocument(document: any, context?: any): Promise<AIResponse> {
    const prompt = this.buildDocumentAnalysisPrompt(document, context)
    return this.sendRequest(prompt, { context })
  }
  
  async generateLegalAdvice(question: string, context?: any): Promise<AIResponse> {
    const prompt = this.buildLegalAdvicePrompt(question, context)
    return this.sendRequest(prompt, { context })
  }
  
  async structureDossier(dossier: any, documents: any[]): Promise<AIResponse> {
    const prompt = this.buildDossierStructurePrompt(dossier, documents)
    return this.sendRequest(prompt, { context: { dossier, documents } })
  }
  
  async detectAlienationPatterns(journalEntries: any[]): Promise<AIResponse> {
    const prompt = this.buildAlienationAnalysisPrompt(journalEntries)
    return this.sendRequest(prompt, { context: { journalEntries } })
  }
  
  async generateReport(dossier: any, data: any): Promise<AIResponse> {
    const prompt = this.buildReportGenerationPrompt(dossier, data)
    return this.sendRequest(prompt, { context: { dossier, ...data } })
  }
  
  async searchJurisprudence(query: string, filters?: any): Promise<AIResponse> {
    const prompt = this.buildJurisprudenceSearchPrompt(query, filters)
    return this.sendRequest(prompt)
  }
  
  async generateDocumentTemplate(templateType: string, variables: any): Promise<AIResponse> {
    const prompt = this.buildTemplateGenerationPrompt(templateType, variables)
    return this.sendRequest(prompt, { context: { variables } })
  }
  
  private buildDocumentAnalysisPrompt(document: any, context?: any): string {
    return `
    Analysez le document juridique suivant pour un dossier de droit familial au Québec.
    
    Document: ${document.titre}
    Type: ${document.type}
    ${document.description ? `Description: ${document.description}` : ''}
    
    Contexte du dossier:
    ${context?.dossier ? `Type: ${context.dossier.type}, Statut: ${context.dossier.statut}` : 'Non spécifié'}
    
    Instructions:
    1. Identifiez les informations clés
    2. Relevez les éléments pertinents pour le droit familial québécois
    3. Signalez les incohérences ou problèmes potentiels
    4. Proposez des actions recommandées
    5. Citez les articles pertinents du Code civil du Québec
    
    Répondez en français, de manière structurée et professionnelle.
    `
  }
  
  private buildLegalAdvicePrompt(question: string, context?: any): string {
    return `
    En tant qu'assistant juridique spécialisé en droit familial québécois, répondez à la question suivante.
    
    Question: ${question}
    
    Contexte utilisateur:
    Rôle: ${context?.userRole || 'Non spécifié'}
    ${context?.dossier ? `Dossier: ${context.dossier.titre}` : ''}
    
    Instructions:
    1. Fournissez une réponse précise basée sur le droit québécois
    2. Citez les lois et articles pertinents (Code civil, LPJ, etc.)
    3. Mentionnez la jurisprudence applicable
    4. Proposez des étapes concrètes à suivre
    5. Indiquez les délais légaux importants
    6. Avertissez des limitations (ceci n'est pas un conseil juridique officiel)
    
    Répondez en français, de manière claire et accessible.
    `
  }
  
  private buildDossierStructurePrompt(dossier: any, documents: any[]): string {
    return `
    Structurez le dossier suivant de manière optimale pour une présentation en cour.
    
    Dossier: ${dossier.titre}
    Type: ${dossier.type}
    Description: ${dossier.description || 'Non spécifié'}
    
    Documents disponibles (${documents.length}):
    ${documents.map(doc => `- ${doc.titre} (${doc.type})`).join('\n')}
    
    Instructions:
    1. Proposez une structure logique pour organiser les documents
    2. Identifiez les documents manquants nécessaires
    3. Suggérez un ordre de présentation
    4. Recommandez des arguments juridiques à développer
    5. Estimez la force du dossier (faible/moyenne/forte)
    
    Répondez en français avec une structure claire.
    `
  }
  
  private buildAlienationAnalysisPrompt(journalEntries: any[]): string {
    return `
    Analysez les entrées de journal suivantes pour détecter des patterns d'aliénation parentale.
    
    Nombre d'entrées: ${journalEntries.length}
    Période: ${journalEntries[0]?.date_incident} à ${journalEntries[journalEntries.length - 1]?.date_incident}
    
    Entrées:
    ${journalEntries.map(entry => `
    Date: ${entry.date_incident}
    Titre: ${entry.titre}
    Description: ${entry.description}
    Catégorie: ${entry.categorie}
    Gravité: ${entry.gravite}/5
    `).join('\n---\n')}
    
    Instructions:
    1. Identifiez les patterns récurrents
    2. Évaluez la gravité globale
    3. Détectez l'escalade dans le temps
    4. Recommandez des actions spécifiques
    5. Suggérez des preuves supplémentaires à recueillir
    6. Proposez une stratégie de documentation
    
    Répondez en français avec une analyse détaillée.
    `
  }
  
  private buildReportGenerationPrompt(dossier: any, data: any): string {
    return `
    Générez un rapport professionnel pour le dossier suivant.
    
    Dossier: ${dossier.titre}
    Type de rapport: ${data.reportType || 'Général'}
    Destinataire: ${data.recipient || 'Non spécifié'}
    
    Données disponibles:
    - ${data.documents?.length || 0} documents
    - ${data.journalEntries?.length || 0} entrées de journal
    - ${data.events?.length || 0} événements
    
    Instructions:
    1. Structurez le rapport de manière professionnelle
    2. Incluez un résumé exécutif
    3. Présentez les faits de manière chronologique
    4. Analysez les aspects juridiques
    5. Formulez des recommandations claires
    6. Ajoutez les annexes nécessaires
    
    Format: Rapport formel en français
    `
  }
  
  private buildJurisprudenceSearchPrompt(query: string, filters?: any): string {
    return `
    Recherchez la jurisprudence québécoise pertinente pour la question suivante.
    
    Question: ${query}
    
    Filtres:
    ${filters?.domain ? `Domaine: ${filters.domain}` : ''}
    ${filters?.years ? `Années: ${filters.years}` : ''}
    ${filters?.court ? `Cour: ${filters.court}` : ''}
    
    Instructions:
    1. Trouvez les arrêts pertinents
    2. Résumez les faits et la décision
    3. Extrayez les principes juridiques
    4. Indiquez la citation complète
    5. Évaluez l'applicabilité au cas présent
    
    Répondez en français avec les références exactes.
    `
  }
  
  private buildTemplateGenerationPrompt(templateType: string, variables: any): string {
    return `
    Générez un modèle de document juridique pour le Québec.
    
    Type de document: ${templateType}
    
    Variables fournies:
    ${Object.entries(variables).map(([key, value]) => `- ${key}: ${value}`).join('\n')}
    
    Instructions:
    1. Créez un document juridiquement correct
    2. Adaptez-le au droit québécois
    3. Incluez toutes les sections nécessaires
    4. Utilisez un langage professionnel mais accessible
    5. Ajoutez des commentaires pour guider l'utilisateur
    6. Respectez les formalités requises
    
    Format: Document prêt à utiliser en français
    `
  }
  
  private async sendRequest(prompt: string, options?: any): Promise<AIResponse> {
    // In development, return mock responses
    if (!this.apiKey || process.env.NODE_ENV === 'development') {
      return this.getMockResponse(prompt, options)
    }
    
    // In production, call actual API
    try {
      const response = await fetch(`${this.baseUrl}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey!,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: options?.model || 'claude-3-5-sonnet',
          max_tokens: options?.maxTokens || 4000,
          temperature: options?.temperature || 0.3,
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
          system: "Vous êtes un assistant juridique expert en droit familial québécois. Répondez de manière précise, professionnelle et éthique. Mentionnez toujours que vous n'êtes pas un avocat et que vos conseils sont informatifs.",
        }),
      })
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }
      
      const data = await response.json()
      
      return {
        content: data.content[0].text,
        model: data.model,
        tokens: data.usage?.total_tokens || 0,
        cost: this.calculateCost(data.model, data.usage?.total_tokens || 0),
        citations: this.extractCitations(data.content[0].text),
      }
    } catch (error) {
      console.error('AI API error:', error)
      // Fallback to mock response
      return this.getMockResponse(prompt, options)
    }
  }
  
  private getMockResponse(prompt: string, options?: any): AIResponse {
    // Generate appropriate mock response based on prompt type
    let content = ''
    
    if (prompt.includes('Analysez le document')) {
      content = this.getMockDocumentAnalysis()
    } else if (prompt.includes('répondez à la question')) {
      content = this.getMockLegalAdvice()
    } else if (prompt.includes('Structurez le dossier')) {
      content = this.getMockDossierStructure()
    } else if (prompt.includes('aliénation parentale')) {
      content = this.getMockAlienationAnalysis()
    } else if (prompt.includes('Générez un rapport')) {
      content = this.getMockReport()
    } else if (prompt.includes('jurisprudence')) {
      content = this.getMockJurisprudence()
    } else if (prompt.includes('modèle de document')) {
      content = this.getMockTemplate()
    } else {
      content = this.getGenericMockResponse()
    }
    
    return {
      content,
      model: 'claude-3-5-sonnet-mock',
      tokens: 1500,
      cost: 0.015,
      citations: ['Code civil du Québec, art. 600', 'Loi sur la protection de la jeunesse, art. 38'],
    }
  }
  
  private getMockDocumentAnalysis(): string {
    return `**ANALYSE DE DOCUMENT - RAPPORT PROFESSIONNEL**

**1. INFORMATIONS CLÉS IDENTIFIÉES**
- Document: Contrat de garde partagée
- Date: 15 mars 2024
- Parties: Parent A et Parent B
- Enfant concerné: [Nom], né le 15/06/2018

**2. ÉLÉMENTS PERTINENTS POUR LE DROIT FAMILIAL QUÉBÉCOIS**
- Garde partagée 50/50 établie
- Résidence principale alternante chaque semaine
- Pension alimentaire fixée à 300$/mois
- Décisions majeures conjointes

**3. INCOHÉRENCES/PROBLÈMES POTENTIELS**
⚠️ **Problème identifié**: La clause sur les vacances est ambiguë
- Texte: "Les vacances seront partagées équitablement"
- Problème: Pas de mécanisme de sélection défini
- Risque: Conflits lors des périodes de vacances

⚠️ **Problème identifié**: Absence de clause de révision
- La pension alimentaire n'est pas indexée
- Pas de mécanisme de révision prévu
- Risque: Déséquilibre financier dans le temps

**4. ACTIONS RECOMMANDÉES**
1. **Clarifier la clause des vacances**
   - Établir un système de sélection (années paires/impaires)
   - Définir les périodes précises

2. **Ajouter une clause de révision**
   - Indexation annuelle selon l'IPC
   - Révision aux 3 ans ou changement de situation

3. **Compléter avec un calendrier parental**
   - Intégrer un calendrier détaillé en annexe
   - Prévoir les fêtes et occasions spéciales

**5. RÉFÉRENCES JURIDIQUES**
- **Code civil du Québec, art. 600**: Principe de l'intérêt de l'enfant
- **Code civil du Québec, art. 587**: Obligation alimentaire
- **Loi sur le divorce, art. 15.1**: Facteurs pour pension alimentaire

**6. ÉVALUATION GLOBALE**
- 📊 **Force du document**: Moyenne (7/10)
- ✅ **Points forts**: Structure claire, garde équilibrée
- ⚠️ **Points faibles**: Clauses ambiguës, absence d'indexation
- 🎯 **Priorité**: Clarification avant signature

**7. MODÈLE DE CLAUSE SUGGÉRÉE**
\`\`\`
ARTICLE 5 - VACANCES ET CONGÉS
5.1 Les vacances estivales (juillet-août) seront partagées comme suit:
   - Années paires: Parent A du 1er au 15 juillet, Parent B du 16 au 31 juillet
   - Années impaires: inversion des périodes
5.2 Les vacances scolaires (Noël, relâche) alterneront annuellement
\`\`\`

**8. AVERTISSEMENT JURIDIQUE**
*Cette analyse est informative. Consultez un avocat pour des conseils juridiques personnalisés. Les lois peuvent changer et chaque situation est unique.*`
  }
  
  private getMockLegalAdvice(): string {
    return `**CONSEIL JURIDIQUE - DROIT FAMILIAL QUÉBÉCOIS**

**QUESTION TRAITÉE**: Comment documenter efficacement un cas d'aliénation parentale pour la DPJ?

**RÉPONSE DÉTAILLÉE**

**1. BASE LÉGALE**
- **Loi sur la protection de la jeunesse (LPJ), art. 38**: Signalement obligatoire
- **Code civil du Québec, art. 33**: Droit de l'enfant à une relation avec ses deux parents
- **Charte des droits et libertés, art. 40**: Droit à la protection

**2. ÉTAPES CONCRÈTES POUR LA DOCUMENTATION**

**Étape 1: Journal détaillé (ESSENTIEL)**
\`\`\`
Format recommandé:
- Date et heure exactes
- Lieu précis
- Personnes présentes
- Citations exactes (entre guillemets)
- Comportements observés
- Impact sur l'enfant (émotions, réactions)
- Preuves disponibles (photos, messages, etc.)
\`\`\`

**Étape 2: Types de preuves à recueillir**
✅ **Messages écrits**: SMS, emails, messages sociaux
✅ **Enregistrements audio**: Avec consentement (art. 184 C.cr.)
✅ **Témoignages**: Amis, famille, professionnels
✅ **Documents**: Rapports d'école, notes médicales
✅ **Photos**: Situations, blessures, contextes

**Étape 3: Signes spécifiques à documenter**
🔴 **Dénigrement systématique**
   - Critiques constantes de l'autre parent
   - Mensonges sur l'autre parent
   - Attribution de mauvaises intentions

🔴 **Entrave aux relations**
   - Refus de visites sans raison valable
   - Interception de communications
   - Modification unilatérale d'horaire

🔴 **Manipulation émotionnelle**
   - Culpabilisation de l'enfant
   - Chantage affectif
   - Victimisation du parent aliénant

*Avertissement: Cette information est fournie à titre informatif uniquement et ne constitue pas un avis juridique.*`
  }

  private getMockDossierStructure(): string {
    return "Structure du dossier analysée. Documents classés par pertinence et chronologie."
  }

  private getMockAlienationAnalysis(): string {
    return "Analyse des patterns d'aliénation parentale complétée. Plusieurs indicateurs identifiés."
  }

  private getMockReport(): string {
    return "Rapport généré avec succès. Résumé exécutif, chronologie et recommandations inclus."
  }

  private getMockJurisprudence(): string {
    return "Recherche jurisprudentielle complétée. Arrêts pertinents identifiés."
  }

  private getMockTemplate(): string {
    return "Modèle de document généré selon les normes du droit québécois."
  }

  private getGenericMockResponse(): string {
    return "Réponse générée par l'assistant IA juridique. Pour des conseils personnalisés, consultez un avocat."
  }

  private calculateCost(model: string, tokens: number): number {
    const rates: Record<string, number> = {
      'claude-3-5-sonnet': 0.003,
      'claude-3-haiku': 0.00025,
    }
    const rate = rates[model] || 0.003
    return (tokens / 1000) * rate
  }

  private extractCitations(text: string): string[] {
    const citations: string[] = []
    const patterns = [
      /art\.\s*\d+/gi,
      /Code civil[^,.]*/gi,
      /Loi sur[^,.]*/gi,
    ]
    for (const pattern of patterns) {
      const matches = text.match(pattern)
      if (matches) citations.push(...matches)
    }
    return Array.from(new Set(citations))
  }
}