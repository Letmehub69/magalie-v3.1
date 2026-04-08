// Client Supabase mocké pour le développement local sans Docker
import {
  mockProfiles,
  mockDossiers,
  mockDocuments,
  mockJournalEntries,
  mockChatMessages,
  mockTemplates,
  mockResources,
  simulateNetworkDelay,
  isMockMode,
} from './mock-data'

// Simuler l'authentification
export const mockAuth = {
  getUser: async () => {
    await simulateNetworkDelay()
    return {
      data: { user: mockProfiles[0] },
      error: null,
    }
  },
  
  signUp: async (credentials: any) => {
    await simulateNetworkDelay(500)
    return {
      data: { user: mockProfiles[0], session: null },
      error: null,
    }
  },
  
  signIn: async (credentials: any) => {
    await simulateNetworkDelay(300)
    return {
      data: { user: mockProfiles[0], session: { access_token: 'mock-token' } },
      error: null,
    }
  },
  
  signOut: async () => {
    await simulateNetworkDelay(200)
    return { error: null }
  },
}

// Simuler les opérations CRUD
export const mockSupabase = {
  auth: mockAuth,
  
  from: (table: string) => {
    const getTableData = () => {
      switch (table) {
        case 'profiles': return mockProfiles
        case 'dossiers': return mockDossiers
        case 'documents': return mockDocuments
        case 'journal_entries': return mockJournalEntries
        case 'chat_messages': return mockChatMessages
        case 'templates': return mockTemplates
        case 'resources': return mockResources
        default: return []
      }
    }
    
    return {
      select: (columns: string = '*') => ({
        eq: (column: string, value: any) => ({
          single: async () => {
            await simulateNetworkDelay()
            const data = getTableData().find((item: any) => item[column] === value)
            return { data, error: data ? null : new Error('Not found') }
          },
          order: (column: string, options: any) => ({
            then: async (callback: any) => {
              await simulateNetworkDelay()
              const data = getTableData()
                .filter((item: any) => item[column] === value)
                .sort((a: any, b: any) => {
                  const aVal = a[options.ascending ? column : 'created_at']
                  const bVal = b[options.ascending ? column : 'created_at']
                  return options.ascending ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
                })
              callback({ data, error: null })
            },
          }),
          then: async (callback: any) => {
            await simulateNetworkDelay()
            const data = getTableData().filter((item: any) => item[column] === value)
            callback({ data, error: null })
          },
        }),
        or: (condition: string) => ({
          order: (column: string, options: any) => ({
            then: async (callback: any) => {
              await simulateNetworkDelay()
              // Simuler une condition OR simple
              const data = getTableData().filter((item: any) => 
                item.created_by === 'user-123' || item.avocat_id === 'user-123'
              )
              callback({ data, error: null })
            },
          }),
        }),
        order: (column: string, options: any) => ({
          then: async (callback: any) => {
            await simulateNetworkDelay()
            const data = getTableData().sort((a: any, b: any) => {
              const aVal = a[options.ascending ? column : 'created_at']
              const bVal = b[options.ascending ? column : 'created_at']
              return options.ascending ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
            })
            callback({ data, error: null })
          },
        }),
        then: async (callback: any) => {
          await simulateNetworkDelay()
          callback({ data: getTableData(), error: null })
        },
      }),
      
      insert: (data: any[]) => ({
        select: () => ({
          single: async () => {
            await simulateNetworkDelay(500)
            const newItem = {
              id: Date.now().toString(),
              ...data[0],
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }
            
            // Ajouter aux données mockées
            switch (table) {
              case 'dossiers':
                mockDossiers.unshift(newItem)
                break
              case 'documents':
                mockDocuments.unshift(newItem)
                break
              case 'journal_entries':
                mockJournalEntries.unshift(newItem)
                break
              case 'chat_messages':
                mockChatMessages.unshift(newItem)
                break
            }
            
            return { data: newItem, error: null }
          },
        }),
      }),
      
      update: (updates: any) => ({
        eq: (column: string, value: any) => ({
          select: () => ({
            single: async () => {
              await simulateNetworkDelay(400)
              const tableData = getTableData()
              const index = tableData.findIndex((item: any) => item[column] === value)
              
              if (index === -1) {
                return { data: null, error: new Error('Not found') }
              }
              
              const updatedItem = {
                ...tableData[index],
                ...updates,
                updated_at: new Date().toISOString(),
              }
              
              // Mettre à jour les données mockées
              switch (table) {
                case 'profiles':
                  mockProfiles[index] = updatedItem
                  break
                case 'dossiers':
                  mockDossiers[index] = updatedItem
                  break
              }
              
              return { data: updatedItem, error: null }
            },
          }),
        }),
      }),
    }
  },
  
  storage: {
    from: (bucket: string) => ({
      upload: async (path: string, file: File) => {
        await simulateNetworkDelay(800)
        console.log(`Mock upload: ${file.name} to ${path}`)
        return { error: null }
      },
    }),
  },
  
  channel: (name: string) => ({
    on: (event: string, config: any, callback: any) => ({
      subscribe: () => {
        console.log(`Mock subscription to channel: ${name}`)
        return { unsubscribe: () => {} }
      },
    }),
  }),
  
  removeChannel: () => {},
}

// Fonctions utilitaires mockées
export const mockGetCurrentUser = async () => {
  if (!isMockMode()) {
    throw new Error('Mock mode not enabled')
  }
  await simulateNetworkDelay()
  return mockProfiles[0]
}

export const mockGetProfile = async (userId?: string) => {
  if (!isMockMode()) {
    throw new Error('Mock mode not enabled')
  }
  await simulateNetworkDelay()
  return mockProfiles.find(p => p.id === (userId || 'user-123')) || null
}

export const mockUpdateProfile = async (updates: any) => {
  if (!isMockMode()) {
    throw new Error('Mock mode not enabled')
  }
  await simulateNetworkDelay(400)
  const profile = mockProfiles[0]
  const updatedProfile = { ...profile, ...updates, updated_at: new Date().toISOString() }
  mockProfiles[0] = updatedProfile
  return updatedProfile
}

export const mockCreateDossier = async (dossierData: any) => {
  if (!isMockMode()) {
    throw new Error('Mock mode not enabled')
  }
  await simulateNetworkDelay(500)
  const newDossier = {
    id: Date.now().toString(),
    ...dossierData,
    dossier_number: `FAM-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
    created_by: 'user-123',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
  mockDossiers.unshift(newDossier)
  return newDossier
}

export const mockGetDossiers = async (filters?: any) => {
  if (!isMockMode()) {
    throw new Error('Mock mode not enabled')
  }
  await simulateNetworkDelay()
  
  let filtered = mockDossiers.filter(dossier => 
    dossier.created_by === 'user-123' || dossier.avocat_id === 'user-123'
  )
  
  if (filters?.statut) {
    filtered = filtered.filter(d => d.statut === filters.statut)
  }
  
  if (filters?.type) {
    filtered = filtered.filter(d => d.type === filters.type)
  }
  
  return filtered.sort((a, b) => b.created_at.localeCompare(a.created_at))
}

export const mockUploadDocument = async (file: File, dossierId: string, metadata: any) => {
  if (!isMockMode()) {
    throw new Error('Mock mode not enabled')
  }
  await simulateNetworkDelay(800)
  
  const newDocument = {
    id: `doc-${Date.now()}`,
    dossier_id: dossierId,
    titre: metadata.titre || file.name,
    description: metadata.description,
    type: metadata.type || 'autre',
    file_path: `documents/${dossierId}/${file.name}`,
    file_size: file.size,
    mime_type: file.type,
    uploaded_by: 'user-123',
    uploaded_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
  }
  
  mockDocuments.unshift(newDocument)
  return newDocument
}

export const mockGetDocuments = async (dossierId: string) => {
  if (!isMockMode()) {
    throw new Error('Mock mode not enabled')
  }
  await simulateNetworkDelay()
  return mockDocuments
    .filter(doc => doc.dossier_id === dossierId)
    .sort((a, b) => b.uploaded_at.localeCompare(a.uploaded_at))
}

export const mockCreateJournalEntry = async (entryData: any) => {
  if (!isMockMode()) {
    throw new Error('Mock mode not enabled')
  }
  await simulateNetworkDelay(400)
  
  const newEntry = {
    id: `journal-${Date.now()}`,
    ...entryData,
    parent_id: 'user-123',
    created_at: new Date().toISOString(),
  }
  
  mockJournalEntries.unshift(newEntry)
  return newEntry
}

export const mockGetJournalEntries = async (dossierId?: string) => {
  if (!isMockMode()) {
    throw new Error('Mock mode not enabled')
  }
  await simulateNetworkDelay()
  
  let filtered = mockJournalEntries.filter(entry => entry.parent_id === 'user-123')
  
  if (dossierId) {
    filtered = filtered.filter(entry => entry.dossier_id === dossierId)
  }
  
  return filtered.sort((a, b) => b.date_incident.localeCompare(a.date_incident))
}

export const mockSendChatMessage = async (messageData: any) => {
  if (!isMockMode()) {
    throw new Error('Mock mode not enabled')
  }
  await simulateNetworkDelay(300)
  
  const newMessage = {
    id: `chat-${Date.now()}`,
    ...messageData,
    sender_id: 'user-123',
    sent_at: new Date().toISOString(),
    read: false,
  }
  
  mockChatMessages.unshift(newMessage)
  return newMessage
}

export const mockGetChatMessages = async (dossierId: string) => {
  if (!isMockMode()) {
    throw new Error('Mock mode not enabled')
  }
  await simulateNetworkDelay()
  return mockChatMessages
    .filter(msg => msg.dossier_id === dossierId)
    .sort((a, b) => a.sent_at.localeCompare(b.sent_at))
}

export const mockGetTemplates = async (type?: string) => {
  if (!isMockMode()) {
    throw new Error('Mock mode not enabled')
  }
  await simulateNetworkDelay()
  
  let filtered = mockTemplates.filter(t => t.public)
  
  if (type) {
    filtered = filtered.filter(t => t.type === type)
  }
  
  return filtered.sort((a, b) => b.created_at.localeCompare(a.created_at))
}

export const mockGetResources = async (tags?: string[]) => {
  if (!isMockMode()) {
    throw new Error('Mock mode not enabled')
  }
  await simulateNetworkDelay()
  
  let filtered = mockResources.filter(r => r.verified)
  
  if (tags && tags.length > 0) {
    filtered = filtered.filter(r => 
      tags.some(tag => r.tags.includes(tag))
    )
  }
  
  return filtered.sort((a, b) => b.created_at.localeCompare(a.created_at))
}