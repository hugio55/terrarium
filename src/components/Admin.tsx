import { useState, useEffect } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { Id } from '../../convex/_generated/dataModel'

type Rarity = 'common' | 'uncommon' | 'rare' | 'legendary' | 'mythic'

const RARITY_COLORS: Record<Rarity, string> = {
  common: '#ffffff',
  uncommon: '#4ade80',
  rare: '#60a5fa',
  legendary: '#f97316',
  mythic: '#ec4899',
}

const RARITY_ORDER: Record<Rarity, number> = {
  common: 1,
  uncommon: 2,
  rare: 3,
  legendary: 4,
  mythic: 5,
}

type SortField = 'name' | 'rarity' | 'goldValue' | 'goldPerMinute' | 'biome'
type SortDirection = 'asc' | 'desc'

interface CreatureRow {
  _id?: Id<'creatures'>
  name: string
  biomeId?: Id<'biomes'>
  groupId?: Id<'groups'>
  goldValue: number
  goldPerMinute: number
  rarity: Rarity
  imageId?: Id<'_storage'>
  imageUrl?: string
  isNew?: boolean
  isDirty?: boolean
}

interface GroupRow {
  _id?: Id<'groups'>
  name: string
  color?: string
  isNew?: boolean
  isDirty?: boolean
}

interface BiomeRow {
  _id?: Id<'biomes'>
  name: string
  description?: string
  color?: string
  isNew?: boolean
  isDirty?: boolean
}

interface DecorationRow {
  _id?: Id<'decorations'>
  name: string
  biomeId?: Id<'biomes'>
  cost: number
  description?: string
  imageId?: Id<'_storage'>
  imageUrl?: string
  isNew?: boolean
  isDirty?: boolean
}

type TabType = 'biomes' | 'creatures' | 'decorations' | 'chart'

type ChartVariant = 'normal' | 'gold' | 'corrupted'

// Creature chart configuration
const CHART_COLUMNS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
const CHART_ROWS = [1, 2, 3, 4, 5]

// Rarity distribution by column (A-Z)
// Common: A-J (10), Uncommon: K-P (6), Rare: Q-U (5), Legendary: V-X (3), Mythic: Y (1), Unique: Z (1)
const getColumnRarity = (col: string): 'common' | 'uncommon' | 'rare' | 'legendary' | 'mythic' | 'unique' => {
  const idx = col.charCodeAt(0) - 65 // A=0, B=1, etc.
  if (idx <= 9) return 'common'      // A-J (0-9)
  if (idx <= 15) return 'uncommon'   // K-P (10-15)
  if (idx <= 20) return 'rare'       // Q-U (16-20)
  if (idx <= 23) return 'legendary'  // V-X (21-23)
  if (idx === 24) return 'mythic'    // Y (24)
  return 'unique'                     // Z (25)
}

const CHART_RARITY_COLORS: Record<string, { bg: string; border: string }> = {
  common: { bg: '#c4a77d', border: '#8b7355' },      // Tan
  uncommon: { bg: '#4a90d9', border: '#2d5a8c' },    // Blue
  rare: { bg: '#d94a8c', border: '#8c2d5a' },        // Pink
  legendary: { bg: '#f5a623', border: '#b87a1a' },   // Yellow/Orange
  mythic: { bg: '#c41e3a', border: '#8b1528' },      // Red
  unique: { bg: '#4ade80', border: '#2d8b4a' },      // Green
}

export function Admin({ onClose }: { onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<TabType>('creatures')
  const [creatures, setCreatures] = useState<CreatureRow[]>([])
  const [biomes, setBiomes] = useState<BiomeRow[]>([])
  const [decorations, setDecorations] = useState<DecorationRow[]>([])
  const [groups, setGroups] = useState<GroupRow[]>([])
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [saving, setSaving] = useState(false)

  // Lightbox state for viewing full-size images
  const [lightboxImage, setLightboxImage] = useState<{ url: string; name: string } | null>(null)

  // Groups management modal
  const [showGroupsModal, setShowGroupsModal] = useState(false)

  // Group filter for creatures tab
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<Id<'groups'> | 'all'>('all')

  // Chart variant for creature chart tab
  const [chartVariant, setChartVariant] = useState<ChartVariant>('normal')

  // Edit mode tracking - stores IDs of rows being edited
  const [editingCreatures, setEditingCreatures] = useState<Set<string>>(new Set())
  // Future: Add edit mode for biomes and decorations
  // const [editingBiomes, setEditingBiomes] = useState<Set<string>>(new Set())
  // const [editingDecorations, setEditingDecorations] = useState<Set<string>>(new Set())

  // Sorting state
  const [sortField, setSortField] = useState<SortField>('name')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')

  // Queries
  const dbCreatures = useQuery(api.creatures.list)
  const dbBiomes = useQuery(api.biomes.list)
  const dbDecorations = useQuery(api.decorations.list)
  const dbGroups = useQuery(api.groups.list)

  // Mutations
  const createCreature = useMutation(api.creatures.create)
  const updateCreature = useMutation(api.creatures.update)
  const deleteCreature = useMutation(api.creatures.remove)
  const generateCreatureUploadUrl = useMutation(api.creatures.generateUploadUrl)

  const createBiome = useMutation(api.biomes.create)
  const updateBiome = useMutation(api.biomes.update)
  const deleteBiome = useMutation(api.biomes.remove)

  const createDecoration = useMutation(api.decorations.create)
  const updateDecoration = useMutation(api.decorations.update)
  const deleteDecoration = useMutation(api.decorations.remove)
  const generateDecorationUploadUrl = useMutation(api.decorations.generateUploadUrl)

  const createGroup = useMutation(api.groups.create)
  const updateGroup = useMutation(api.groups.update)
  const deleteGroup = useMutation(api.groups.remove)

  // Track if we've done initial load
  const [initialized, setInitialized] = useState(false)

  // Sync from database when data loads (only on initial load or after save refresh)
  useEffect(() => {
    if (dbCreatures && !initialized) {
      console.log('[🔄SYNC] Loading creatures from database:')
      dbCreatures.forEach((c, i) => {
        console.log(`  [${i}] name: ${c.name}, imageId: ${c.imageId}, imageUrl: ${c.imageUrl}`)
      })
      setCreatures(dbCreatures.map(c => ({ ...c, isDirty: false })))
      if (dbBiomes && dbDecorations !== undefined) {
        setInitialized(true)
      }
    }
  }, [dbCreatures, initialized])

  useEffect(() => {
    if (dbBiomes && !initialized) {
      console.log('[🔄SYNC] Loading biomes from database:', dbBiomes)
      setBiomes(dbBiomes.map(b => ({ ...b, isDirty: false })))
    }
  }, [dbBiomes, initialized])

  useEffect(() => {
    if (dbDecorations && !initialized) {
      console.log('[🔄SYNC] Loading decorations from database:', dbDecorations)
      setDecorations(dbDecorations.map(d => ({ ...d, isDirty: false })))
    }
  }, [dbDecorations, initialized])

  useEffect(() => {
    if (dbGroups && !initialized) {
      console.log('[🔄SYNC] Loading groups from database:', dbGroups)
      setGroups(dbGroups.map(g => ({ ...g, isDirty: false })))
    }
  }, [dbGroups, initialized])

  const handleAddCreature = () => {
    const newId = `new-${Date.now()}`
    setCreatures([...creatures, {
      name: '',
      goldValue: 0,
      goldPerMinute: 0,
      rarity: 'common',
      isNew: true,
      isDirty: true,
    }])
    // Auto-enter edit mode for new rows
    setEditingCreatures(prev => new Set(prev).add(newId))
    setHasUnsavedChanges(true)
  }

  // Toggle edit mode for a creature
  const toggleEditCreature = (id: string) => {
    setEditingCreatures(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  // Check if a creature is in edit mode
  const isCreatureEditing = (creature: CreatureRow, index: number): boolean => {
    const id = creature._id || `new-${index}`
    return creature.isNew || editingCreatures.has(id)
  }

  // Get sorted and filtered creatures
  const getSortedCreatures = (): CreatureRow[] => {
    // First filter by group if a group is selected
    let filtered = creatures
    if (selectedGroupFilter !== 'all') {
      filtered = creatures.filter(c => c.groupId === selectedGroupFilter)
    }

    // Then sort
    return [...filtered].sort((a, b) => {
      let comparison = 0
      switch (sortField) {
        case 'name':
          comparison = a.name.localeCompare(b.name)
          break
        case 'rarity':
          comparison = RARITY_ORDER[a.rarity] - RARITY_ORDER[b.rarity]
          break
        case 'goldValue':
          comparison = a.goldValue - b.goldValue
          break
        case 'goldPerMinute':
          comparison = a.goldPerMinute - b.goldPerMinute
          break
        case 'biome':
          const biomeNameA = biomes.find(bio => bio._id === a.biomeId)?.name || ''
          const biomeNameB = biomes.find(bio => bio._id === b.biomeId)?.name || ''
          comparison = biomeNameA.localeCompare(biomeNameB)
          break
      }
      return sortDirection === 'asc' ? comparison : -comparison
    })
  }

  // Handle sort change
  const handleSortChange = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const handleAddBiome = () => {
    setBiomes([...biomes, {
      name: '',
      description: '',
      color: '#4a7c59',
      isNew: true,
      isDirty: true,
    }])
    setHasUnsavedChanges(true)
  }

  const handleAddDecoration = () => {
    setDecorations([...decorations, {
      name: '',
      cost: 0,
      description: '',
      isNew: true,
      isDirty: true,
    }])
    setHasUnsavedChanges(true)
  }

  const handleCreatureChange = (index: number, field: keyof CreatureRow, value: any) => {
    setCreatures(prev => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value, isDirty: true }
      return updated
    })
    setHasUnsavedChanges(true)
  }

  // Update multiple fields at once to avoid state race conditions
  const handleCreatureMultiChange = (index: number, changes: Partial<CreatureRow>) => {
    setCreatures(prev => {
      const updated = [...prev]
      updated[index] = { ...updated[index], ...changes, isDirty: true }
      return updated
    })
    setHasUnsavedChanges(true)
  }

  const handleBiomeChange = (index: number, field: keyof BiomeRow, value: any) => {
    const updated = [...biomes]
    updated[index] = { ...updated[index], [field]: value, isDirty: true }
    setBiomes(updated)
    setHasUnsavedChanges(true)
  }

  const handleDecorationChange = (index: number, field: keyof DecorationRow, value: any) => {
    setDecorations(prev => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value, isDirty: true }
      return updated
    })
    setHasUnsavedChanges(true)
  }

  // Update multiple fields at once to avoid state race conditions
  const handleDecorationMultiChange = (index: number, changes: Partial<DecorationRow>) => {
    setDecorations(prev => {
      const updated = [...prev]
      updated[index] = { ...updated[index], ...changes, isDirty: true }
      return updated
    })
    setHasUnsavedChanges(true)
  }

  // Group handlers
  const handleAddGroup = () => {
    if (groups.length >= 50) {
      alert('Maximum of 50 groups allowed')
      return
    }
    setGroups([...groups, {
      name: '',
      color: '#4ade80',
      isNew: true,
      isDirty: true,
    }])
    setHasUnsavedChanges(true)
  }

  const handleGroupChange = (index: number, field: keyof GroupRow, value: any) => {
    setGroups(prev => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value, isDirty: true }
      return updated
    })
    setHasUnsavedChanges(true)
  }

  const handleDeleteGroup = async (index: number) => {
    const group = groups[index]
    if (group._id) {
      await deleteGroup({ id: group._id })
      // Clear filter if we deleted the currently filtered group
      if (selectedGroupFilter === group._id) {
        setSelectedGroupFilter('all')
      }
    }
    setGroups(groups.filter((_, i) => i !== index))
  }

  const handleDeleteCreature = async (index: number) => {
    const creature = creatures[index]
    if (creature._id) {
      await deleteCreature({ id: creature._id })
    }
    setCreatures(creatures.filter((_, i) => i !== index))
  }

  const handleDeleteBiome = async (index: number) => {
    const biome = biomes[index]
    if (biome._id) {
      await deleteBiome({ id: biome._id })
    }
    setBiomes(biomes.filter((_, i) => i !== index))
  }

  const handleDeleteDecoration = async (index: number) => {
    const decoration = decorations[index]
    if (decoration._id) {
      await deleteDecoration({ id: decoration._id })
    }
    setDecorations(decorations.filter((_, i) => i !== index))
  }

  const handleImageUpload = async (
    index: number,
    file: File,
    type: 'creature' | 'decoration'
  ) => {
    try {
      const generateUrl = type === 'creature' ? generateCreatureUploadUrl : generateDecorationUploadUrl
      const uploadUrl = await generateUrl()

      const result = await fetch(uploadUrl, {
        method: 'POST',
        headers: { 'Content-Type': file.type },
        body: file,
      })

      if (!result.ok) {
        throw new Error(`Upload failed: ${result.status}`)
      }

      const json = await result.json()
      const storageId = json.storageId

      if (!storageId) {
        throw new Error('No storageId returned from upload')
      }

      // Create a temporary preview URL for immediate display
      const previewUrl = URL.createObjectURL(file)

      if (type === 'creature') {
        // Store both imageId and preview URL at once to avoid state race condition
        handleCreatureMultiChange(index, {
          imageId: storageId,
          imageUrl: previewUrl,
        })
      } else {
        handleDecorationMultiChange(index, {
          imageId: storageId,
          imageUrl: previewUrl,
        })
      }

      console.log('[📸UPLOAD] Image uploaded successfully, storageId:', storageId)
    } catch (error) {
      console.error('[📸UPLOAD] Error uploading image:', error)
      alert('Failed to upload image. Please try again.')
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      // Save creatures
      for (const creature of creatures) {
        if (creature.isDirty) {
          console.log('[💾SAVE] Saving creature:', creature.name, 'imageId:', creature.imageId)
          if (creature.isNew) {
            // Build create object, only including defined values
            const createData: Record<string, unknown> = {
              name: creature.name,
              goldValue: creature.goldValue,
              goldPerMinute: creature.goldPerMinute,
              rarity: creature.rarity,
            }
            if (creature.biomeId !== undefined) {
              createData.biomeId = creature.biomeId
            }
            if (creature.groupId !== undefined) {
              createData.groupId = creature.groupId
            }
            if (creature.imageId !== undefined) {
              createData.imageId = creature.imageId
            }
            const result = await createCreature(createData as any)
            console.log('[💾SAVE] Created creature with id:', result)
          } else if (creature._id) {
            // Build update object, only including defined values
            const updateData: Record<string, unknown> = {
              id: creature._id,
              name: creature.name,
              goldValue: creature.goldValue,
              goldPerMinute: creature.goldPerMinute,
              rarity: creature.rarity,
            }
            // Only include optional fields if they have values
            if (creature.biomeId !== undefined) {
              updateData.biomeId = creature.biomeId
            }
            if (creature.groupId !== undefined) {
              updateData.groupId = creature.groupId
            }
            if (creature.imageId !== undefined) {
              updateData.imageId = creature.imageId
            }
            await updateCreature(updateData as any)
          }
        }
      }

      // Save biomes
      for (const biome of biomes) {
        if (biome.isDirty) {
          if (biome.isNew) {
            await createBiome({
              name: biome.name,
              description: biome.description,
              color: biome.color,
            })
          } else if (biome._id) {
            await updateBiome({
              id: biome._id,
              name: biome.name,
              description: biome.description,
              color: biome.color,
            })
          }
        }
      }

      // Save decorations
      for (const decoration of decorations) {
        if (decoration.isDirty) {
          if (decoration.isNew) {
            // Build create object, only including defined values
            const createData: Record<string, unknown> = {
              name: decoration.name,
              cost: decoration.cost,
            }
            if (decoration.biomeId !== undefined) {
              createData.biomeId = decoration.biomeId
            }
            if (decoration.description !== undefined) {
              createData.description = decoration.description
            }
            if (decoration.imageId !== undefined) {
              createData.imageId = decoration.imageId
            }
            await createDecoration(createData as any)
          } else if (decoration._id) {
            // Build update object, only including defined values
            const updateData: Record<string, unknown> = {
              id: decoration._id,
              name: decoration.name,
              cost: decoration.cost,
            }
            // Only include optional fields if they have values
            if (decoration.biomeId !== undefined) {
              updateData.biomeId = decoration.biomeId
            }
            if (decoration.description !== undefined) {
              updateData.description = decoration.description
            }
            if (decoration.imageId !== undefined) {
              updateData.imageId = decoration.imageId
            }
            await updateDecoration(updateData as any)
          }
        }
      }

      // Save groups
      for (const group of groups) {
        if (group.isDirty) {
          if (group.isNew) {
            await createGroup({
              name: group.name,
              color: group.color,
            })
          } else if (group._id) {
            const updateData: Record<string, unknown> = {
              id: group._id,
              name: group.name,
            }
            if (group.color !== undefined) {
              updateData.color = group.color
            }
            await updateGroup(updateData as any)
          }
        }
      }

      // Reset initialized flag to force reload from database
      // This ensures we get the real image URLs from Convex storage
      setInitialized(false)
      setCreatures([])
      setBiomes([])
      setDecorations([])
      setGroups([])
      setHasUnsavedChanges(false)
      console.log('[💾SAVE] Save complete, refreshing from database...')
    } catch (error) {
      console.error('[💾SAVE] Error saving:', error)
      alert('Error saving changes. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const tabStyle = (tab: TabType) => ({
    padding: '12px 24px',
    cursor: 'pointer',
    backgroundColor: activeTab === tab ? '#2d4a3e' : 'transparent',
    border: 'none',
    borderBottom: activeTab === tab ? '3px solid #4ade80' : '3px solid transparent',
    color: activeTab === tab ? '#4ade80' : '#888',
    fontSize: '16px',
    fontWeight: 'bold',
    transition: 'all 0.2s',
  })

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: '#1a1a2e',
      zIndex: 1000,
      overflow: 'auto',
    }}>
      {/* Image Lightbox */}
      {lightboxImage && (
        <div
          onClick={() => setLightboxImage(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            zIndex: 2000,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <img
            src={lightboxImage.url}
            alt={lightboxImage.name}
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '90vw',
              maxHeight: '80vh',
              objectFit: 'contain',
              borderRadius: '8px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
            }}
          />
          <p style={{
            color: '#fff',
            marginTop: '16px',
            fontSize: '18px',
            fontWeight: 'bold',
          }}>
            {lightboxImage.name}
          </p>
          <p style={{
            color: '#888',
            marginTop: '8px',
            fontSize: '14px',
          }}>
            Click anywhere to close
          </p>
        </div>
      )}

      {/* Groups Management Modal */}
      {showGroupsModal && (
        <div
          onClick={() => setShowGroupsModal(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            zIndex: 2000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: '#1a1a2e',
              borderRadius: '12px',
              padding: '24px',
              width: '500px',
              maxHeight: '80vh',
              overflow: 'auto',
              border: '1px solid #333',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ color: '#6366f1', margin: 0 }}>Manage Groups</h2>
              <button
                onClick={() => setShowGroupsModal(false)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#333',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                }}
              >
                Close
              </button>
            </div>

            <p style={{ color: '#888', marginBottom: '16px', fontSize: '14px' }}>
              Groups help organize your creatures into categories. Create groups here, then assign creatures to them in the table.
            </p>

            <button
              onClick={handleAddGroup}
              disabled={groups.length >= 50}
              style={{
                padding: '10px 20px',
                backgroundColor: groups.length >= 50 ? '#555' : '#6366f1',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                cursor: groups.length >= 50 ? 'not-allowed' : 'pointer',
                fontWeight: 'bold',
                marginBottom: '16px',
              }}
            >
              + Add Group ({groups.length}/50)
            </button>

            {groups.length === 0 ? (
              <p style={{ color: '#666', textAlign: 'center', padding: '20px' }}>
                No groups yet. Create one to get started!
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {groups.map((group, index) => (
                  <div
                    key={group._id || `new-${index}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px',
                      backgroundColor: group.isDirty ? '#2a2a3e' : '#0f0f1a',
                      borderRadius: '6px',
                      border: '1px solid #333',
                    }}
                  >
                    <input
                      type="color"
                      value={group.color || '#4ade80'}
                      onChange={(e) => handleGroupChange(index, 'color', e.target.value)}
                      style={{
                        width: '36px',
                        height: '36px',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                      }}
                    />
                    <input
                      type="text"
                      value={group.name}
                      onChange={(e) => handleGroupChange(index, 'name', e.target.value)}
                      placeholder="Group name"
                      style={{
                        flex: 1,
                        padding: '8px 12px',
                        backgroundColor: '#1a1a2e',
                        border: '1px solid #333',
                        borderRadius: '4px',
                        color: '#fff',
                        fontSize: '14px',
                      }}
                    />
                    <button
                      onClick={() => handleDeleteGroup(index)}
                      style={{
                        padding: '8px 12px',
                        backgroundColor: '#ef4444',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px',
                      }}
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            )}

            {hasUnsavedChanges && (
              <p style={{ color: '#ffd700', marginTop: '16px', fontSize: '12px', textAlign: 'center' }}>
                Remember to click "Save Changes" to persist your groups!
              </p>
            )}
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '20px',
        borderBottom: '1px solid #333',
        backgroundColor: '#0f0f1a',
      }}>
        <h1 style={{ color: '#4ade80', margin: 0, fontSize: '28px' }}>Admin Panel</h1>
        <div style={{ display: 'flex', gap: '12px' }}>
          {hasUnsavedChanges && (
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                padding: '10px 24px',
                backgroundColor: saving ? '#555' : '#4ade80',
                color: '#1a1a2e',
                border: 'none',
                borderRadius: '6px',
                cursor: saving ? 'not-allowed' : 'pointer',
                fontWeight: 'bold',
                fontSize: '16px',
              }}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          )}
          <button
            onClick={onClose}
            style={{
              padding: '10px 24px',
              backgroundColor: '#333',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '16px',
            }}
          >
            Close
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid #333',
        backgroundColor: '#0f0f1a',
      }}>
        <button style={tabStyle('biomes')} onClick={() => setActiveTab('biomes')}>
          Biomes
        </button>
        <button style={tabStyle('creatures')} onClick={() => setActiveTab('creatures')}>
          Creatures
        </button>
        <button style={tabStyle('decorations')} onClick={() => setActiveTab('decorations')}>
          Decorations
        </button>
        <button style={tabStyle('chart')} onClick={() => setActiveTab('chart')}>
          Chart
        </button>
      </div>

      {/* Content */}
      <div style={{ padding: '20px' }}>
        {/* BIOMES TAB */}
        {activeTab === 'biomes' && (
          <div>
            <div style={{ marginBottom: '16px' }}>
              <button
                onClick={handleAddBiome}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#4ade80',
                  color: '#1a1a2e',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                }}
              >
                + Add Row
              </button>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#0f0f1a' }}>
                  <th style={{ padding: '12px', textAlign: 'left', color: '#888', borderBottom: '1px solid #333' }}>Name</th>
                  <th style={{ padding: '12px', textAlign: 'left', color: '#888', borderBottom: '1px solid #333' }}>Description</th>
                  <th style={{ padding: '12px', textAlign: 'left', color: '#888', borderBottom: '1px solid #333' }}>Color</th>
                  <th style={{ padding: '12px', textAlign: 'center', color: '#888', borderBottom: '1px solid #333', width: '80px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {biomes.map((biome, index) => (
                  <tr key={biome._id || `new-${index}`} style={{ backgroundColor: biome.isDirty ? '#2a2a3e' : 'transparent' }}>
                    <td style={{ padding: '8px', borderBottom: '1px solid #333' }}>
                      <input
                        type="text"
                        value={biome.name}
                        onChange={(e) => handleBiomeChange(index, 'name', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '8px',
                          backgroundColor: '#0f0f1a',
                          border: '1px solid #333',
                          borderRadius: '4px',
                          color: '#fff',
                        }}
                      />
                    </td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #333' }}>
                      <input
                        type="text"
                        value={biome.description || ''}
                        onChange={(e) => handleBiomeChange(index, 'description', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '8px',
                          backgroundColor: '#0f0f1a',
                          border: '1px solid #333',
                          borderRadius: '4px',
                          color: '#fff',
                        }}
                      />
                    </td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #333' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input
                          type="color"
                          value={biome.color || '#4a7c59'}
                          onChange={(e) => handleBiomeChange(index, 'color', e.target.value)}
                          style={{
                            width: '40px',
                            height: '32px',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                          }}
                        />
                        <span style={{ color: '#888', fontSize: '12px' }}>{biome.color}</span>
                      </div>
                    </td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #333', textAlign: 'center' }}>
                      <button
                        onClick={() => handleDeleteBiome(index)}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: '#ef4444',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                        }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* CREATURES TAB */}
        {activeTab === 'creatures' && (
          <div>
            {/* Controls Row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button
                  onClick={handleAddCreature}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#4ade80',
                    color: '#1a1a2e',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                  }}
                >
                  + Add Row
                </button>

                {/* Groups Button */}
                <button
                  onClick={() => setShowGroupsModal(true)}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#6366f1',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                  }}
                >
                  Groups ({groups.length})
                </button>

                {/* Group Filter Dropdown */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: '#888', fontSize: '14px' }}>Filter:</span>
                  <select
                    value={selectedGroupFilter}
                    onChange={(e) => setSelectedGroupFilter(e.target.value as Id<'groups'> | 'all')}
                    style={{
                      padding: '8px 12px',
                      backgroundColor: '#0f0f1a',
                      border: '1px solid #333',
                      borderRadius: '4px',
                      color: '#fff',
                      fontSize: '14px',
                    }}
                  >
                    <option value="all">All Groups</option>
                    {groups.filter(g => g._id).map(group => (
                      <option key={group._id} value={group._id}>
                        {group.name || 'Unnamed'}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Sort Controls */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#888', fontSize: '14px' }}>Sort by:</span>
                {(['rarity', 'goldValue', 'goldPerMinute', 'biome'] as SortField[]).map(field => (
                  <button
                    key={field}
                    onClick={() => handleSortChange(field)}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: sortField === field ? '#4ade80' : '#333',
                      color: sortField === field ? '#1a1a2e' : '#fff',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: sortField === field ? 'bold' : 'normal',
                    }}
                  >
                    {field === 'goldValue' ? 'Gold Value' : field === 'goldPerMinute' ? 'Gold/Min' : field.charAt(0).toUpperCase() + field.slice(1)}
                    {sortField === field && (sortDirection === 'asc' ? ' ↑' : ' ↓')}
                  </button>
                ))}
              </div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#0f0f1a' }}>
                  <th style={{ padding: '12px', textAlign: 'left', color: '#888', borderBottom: '1px solid #333' }}>Image</th>
                  <th style={{ padding: '12px', textAlign: 'left', color: '#888', borderBottom: '1px solid #333' }}>Name</th>
                  <th style={{ padding: '12px', textAlign: 'left', color: '#888', borderBottom: '1px solid #333' }}>Group</th>
                  <th style={{ padding: '12px', textAlign: 'left', color: '#888', borderBottom: '1px solid #333' }}>Biome</th>
                  <th style={{ padding: '12px', textAlign: 'left', color: '#888', borderBottom: '1px solid #333' }}>Gold Value</th>
                  <th style={{ padding: '12px', textAlign: 'left', color: '#888', borderBottom: '1px solid #333' }}>Gold/Min</th>
                  <th style={{ padding: '12px', textAlign: 'left', color: '#888', borderBottom: '1px solid #333' }}>Rarity</th>
                  <th style={{ padding: '12px', textAlign: 'center', color: '#888', borderBottom: '1px solid #333', width: '140px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {getSortedCreatures().map((creature, index) => {
                  const isEditing = isCreatureEditing(creature, index)
                  const rowId = creature._id || `new-${index}`
                  const biomeName = biomes.find(b => b._id === creature.biomeId)?.name || '—'

                  return (
                    <tr key={rowId} style={{ backgroundColor: creature.isDirty ? '#2a2a3e' : 'transparent' }}>
                      {/* Image Column */}
                      <td style={{ padding: '8px', borderBottom: '1px solid #333' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {creature.imageUrl ? (
                            <img
                              src={creature.imageUrl}
                              alt={creature.name}
                              onClick={() => setLightboxImage({ url: creature.imageUrl!, name: creature.name || 'Creature' })}
                              style={{
                                width: '48px',
                                height: '48px',
                                objectFit: 'cover',
                                borderRadius: '4px',
                                border: '1px solid #333',
                                cursor: 'pointer',
                                transition: 'transform 0.15s, box-shadow 0.15s',
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'scale(1.1)'
                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(74, 222, 128, 0.3)'
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'scale(1)'
                                e.currentTarget.style.boxShadow = 'none'
                              }}
                            />
                          ) : (
                            <div style={{
                              width: '48px',
                              height: '48px',
                              backgroundColor: '#0f0f1a',
                              borderRadius: '4px',
                              border: '1px dashed #333',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#555',
                              fontSize: '10px',
                            }}>
                              No img
                            </div>
                          )}
                          {isEditing && (
                            <label style={{
                              padding: '6px 10px',
                              backgroundColor: '#333',
                              color: '#fff',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '12px',
                            }}>
                              Upload
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                  const file = e.target.files?.[0]
                                  if (file) handleImageUpload(creatures.indexOf(creature), file, 'creature')
                                }}
                                style={{ display: 'none' }}
                              />
                            </label>
                          )}
                        </div>
                      </td>

                      {/* Name Column */}
                      <td style={{ padding: '8px', borderBottom: '1px solid #333' }}>
                        {isEditing ? (
                          <input
                            type="text"
                            value={creature.name}
                            onChange={(e) => handleCreatureChange(creatures.indexOf(creature), 'name', e.target.value)}
                            placeholder="Creature name"
                            style={{
                              width: '100%',
                              padding: '8px',
                              backgroundColor: '#0f0f1a',
                              border: '1px solid #333',
                              borderRadius: '4px',
                              color: '#fff',
                            }}
                          />
                        ) : (
                          <span style={{ color: '#fff', fontWeight: '500' }}>{creature.name || '—'}</span>
                        )}
                      </td>

                      {/* Group Column */}
                      <td style={{ padding: '8px', borderBottom: '1px solid #333' }}>
                        {isEditing ? (
                          <select
                            value={creature.groupId || ''}
                            onChange={(e) => handleCreatureChange(creatures.indexOf(creature), 'groupId', e.target.value || undefined)}
                            style={{
                              width: '100%',
                              padding: '8px',
                              backgroundColor: '#0f0f1a',
                              border: '1px solid #333',
                              borderRadius: '4px',
                              color: '#fff',
                            }}
                          >
                            <option value="">-- No Group --</option>
                            {groups.filter(g => g._id).map(group => (
                              <option key={group._id} value={group._id}>
                                {group.name || 'Unnamed'}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span style={{ color: '#6366f1' }}>
                            {groups.find(g => g._id === creature.groupId)?.name || '—'}
                          </span>
                        )}
                      </td>

                      {/* Biome Column */}
                      <td style={{ padding: '8px', borderBottom: '1px solid #333' }}>
                        {isEditing ? (
                          <select
                            value={creature.biomeId || ''}
                            onChange={(e) => handleCreatureChange(creatures.indexOf(creature), 'biomeId', e.target.value || undefined)}
                            style={{
                              width: '100%',
                              padding: '8px',
                              backgroundColor: '#0f0f1a',
                              border: '1px solid #333',
                              borderRadius: '4px',
                              color: '#fff',
                            }}
                          >
                            <option value="">-- Select Biome --</option>
                            {biomes.map(biome => (
                              <option key={biome._id || biome.name} value={biome._id}>
                                {biome.name}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span style={{ color: '#888' }}>{biomeName}</span>
                        )}
                      </td>

                      {/* Gold Value Column */}
                      <td style={{ padding: '8px', borderBottom: '1px solid #333' }}>
                        {isEditing ? (
                          <input
                            type="number"
                            value={creature.goldValue || ''}
                            onChange={(e) => handleCreatureChange(creatures.indexOf(creature), 'goldValue', parseInt(e.target.value) || 0)}
                            onBlur={(e) => e.target.value = String(parseInt(e.target.value) || 0)}
                            style={{
                              width: '80px',
                              padding: '8px',
                              backgroundColor: '#0f0f1a',
                              border: '1px solid #333',
                              borderRadius: '4px',
                              color: '#ffd700',
                              textAlign: 'right',
                            }}
                          />
                        ) : (
                          <span style={{ color: '#ffd700', fontWeight: 'bold' }}>{creature.goldValue}</span>
                        )}
                      </td>

                      {/* Gold/Min Column */}
                      <td style={{ padding: '8px', borderBottom: '1px solid #333' }}>
                        {isEditing ? (
                          <input
                            type="number"
                            value={creature.goldPerMinute || ''}
                            onChange={(e) => handleCreatureChange(creatures.indexOf(creature), 'goldPerMinute', parseInt(e.target.value) || 0)}
                            onBlur={(e) => e.target.value = String(parseInt(e.target.value) || 0)}
                            style={{
                              width: '80px',
                              padding: '8px',
                              backgroundColor: '#0f0f1a',
                              border: '1px solid #333',
                              borderRadius: '4px',
                              color: '#ffd700',
                              textAlign: 'right',
                            }}
                          />
                        ) : (
                          <span style={{ color: '#ffd700', fontWeight: 'bold' }}>{creature.goldPerMinute}</span>
                        )}
                      </td>

                      {/* Rarity Column */}
                      <td style={{ padding: '8px', borderBottom: '1px solid #333' }}>
                        {isEditing ? (
                          <select
                            value={creature.rarity}
                            onChange={(e) => handleCreatureChange(creatures.indexOf(creature), 'rarity', e.target.value as Rarity)}
                            style={{
                              width: '100%',
                              padding: '8px',
                              backgroundColor: '#0f0f1a',
                              border: '1px solid #333',
                              borderRadius: '4px',
                              color: RARITY_COLORS[creature.rarity],
                              fontWeight: 'bold',
                            }}
                          >
                            <option value="common" style={{ color: RARITY_COLORS.common }}>Common</option>
                            <option value="uncommon" style={{ color: RARITY_COLORS.uncommon }}>Uncommon</option>
                            <option value="rare" style={{ color: RARITY_COLORS.rare }}>Rare</option>
                            <option value="legendary" style={{ color: RARITY_COLORS.legendary }}>Legendary</option>
                            <option value="mythic" style={{ color: RARITY_COLORS.mythic }}>Mythic</option>
                          </select>
                        ) : (
                          <span style={{
                            color: RARITY_COLORS[creature.rarity],
                            fontWeight: 'bold',
                            textTransform: 'capitalize'
                          }}>
                            {creature.rarity}
                          </span>
                        )}
                      </td>

                      {/* Actions Column */}
                      <td style={{ padding: '8px', borderBottom: '1px solid #333', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                          {!creature.isNew && (
                            <button
                              onClick={() => toggleEditCreature(creature._id || rowId)}
                              style={{
                                padding: '6px 12px',
                                backgroundColor: isEditing ? '#6366f1' : '#333',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '12px',
                              }}
                            >
                              {isEditing ? 'Done' : 'Edit'}
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteCreature(creatures.indexOf(creature))}
                            style={{
                              padding: '6px 12px',
                              backgroundColor: '#ef4444',
                              color: '#fff',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '12px',
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* DECORATIONS TAB */}
        {activeTab === 'decorations' && (
          <div>
            <div style={{ marginBottom: '16px' }}>
              <button
                onClick={handleAddDecoration}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#4ade80',
                  color: '#1a1a2e',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                }}
              >
                + Add Row
              </button>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#0f0f1a' }}>
                  <th style={{ padding: '12px', textAlign: 'left', color: '#888', borderBottom: '1px solid #333' }}>Image</th>
                  <th style={{ padding: '12px', textAlign: 'left', color: '#888', borderBottom: '1px solid #333' }}>Name</th>
                  <th style={{ padding: '12px', textAlign: 'left', color: '#888', borderBottom: '1px solid #333' }}>Biome</th>
                  <th style={{ padding: '12px', textAlign: 'left', color: '#888', borderBottom: '1px solid #333' }}>Cost</th>
                  <th style={{ padding: '12px', textAlign: 'left', color: '#888', borderBottom: '1px solid #333' }}>Description</th>
                  <th style={{ padding: '12px', textAlign: 'center', color: '#888', borderBottom: '1px solid #333', width: '80px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {decorations.map((decoration, index) => (
                  <tr key={decoration._id || `new-${index}`} style={{ backgroundColor: decoration.isDirty ? '#2a2a3e' : 'transparent' }}>
                    <td style={{ padding: '8px', borderBottom: '1px solid #333' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {decoration.imageUrl ? (
                          <img
                            src={decoration.imageUrl}
                            alt={decoration.name}
                            onClick={() => setLightboxImage({ url: decoration.imageUrl!, name: decoration.name || 'Decoration' })}
                            style={{
                              width: '48px',
                              height: '48px',
                              objectFit: 'cover',
                              borderRadius: '4px',
                              border: '1px solid #333',
                              cursor: 'pointer',
                              transition: 'transform 0.15s, box-shadow 0.15s',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform = 'scale(1.1)'
                              e.currentTarget.style.boxShadow = '0 4px 12px rgba(74, 222, 128, 0.3)'
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = 'scale(1)'
                              e.currentTarget.style.boxShadow = 'none'
                            }}
                          />
                        ) : (
                          <div style={{
                            width: '48px',
                            height: '48px',
                            backgroundColor: '#0f0f1a',
                            borderRadius: '4px',
                            border: '1px dashed #333',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#555',
                            fontSize: '10px',
                          }}>
                            No img
                          </div>
                        )}
                        <label style={{
                          padding: '6px 10px',
                          backgroundColor: '#333',
                          color: '#fff',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px',
                        }}>
                          Upload
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) handleImageUpload(index, file, 'decoration')
                            }}
                            style={{ display: 'none' }}
                          />
                        </label>
                      </div>
                    </td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #333' }}>
                      <input
                        type="text"
                        value={decoration.name}
                        onChange={(e) => handleDecorationChange(index, 'name', e.target.value)}
                        placeholder="Decoration name"
                        style={{
                          width: '100%',
                          padding: '8px',
                          backgroundColor: '#0f0f1a',
                          border: '1px solid #333',
                          borderRadius: '4px',
                          color: '#fff',
                        }}
                      />
                    </td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #333' }}>
                      <select
                        value={decoration.biomeId || ''}
                        onChange={(e) => handleDecorationChange(index, 'biomeId', e.target.value || undefined)}
                        style={{
                          width: '100%',
                          padding: '8px',
                          backgroundColor: '#0f0f1a',
                          border: '1px solid #333',
                          borderRadius: '4px',
                          color: '#fff',
                        }}
                      >
                        <option value="">-- Select Biome --</option>
                        {biomes.map(biome => (
                          <option key={biome._id || biome.name} value={biome._id}>
                            {biome.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #333' }}>
                      <input
                        type="number"
                        value={decoration.cost || ''}
                        onChange={(e) => handleDecorationChange(index, 'cost', parseInt(e.target.value) || 0)}
                        onBlur={(e) => e.target.value = String(parseInt(e.target.value) || 0)}
                        style={{
                          width: '80px',
                          padding: '8px',
                          backgroundColor: '#0f0f1a',
                          border: '1px solid #333',
                          borderRadius: '4px',
                          color: '#ffd700',
                          textAlign: 'right',
                        }}
                      />
                    </td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #333' }}>
                      <input
                        type="text"
                        value={decoration.description || ''}
                        onChange={(e) => handleDecorationChange(index, 'description', e.target.value)}
                        placeholder="Description"
                        style={{
                          width: '100%',
                          padding: '8px',
                          backgroundColor: '#0f0f1a',
                          border: '1px solid #333',
                          borderRadius: '4px',
                          color: '#fff',
                        }}
                      />
                    </td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #333', textAlign: 'center' }}>
                      <button
                        onClick={() => handleDeleteDecoration(index)}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: '#ef4444',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                        }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* CHART TAB */}
        {activeTab === 'chart' && (
          <div>
            {/* Variant Tabs */}
            <div style={{
              display: 'flex',
              gap: '4px',
              marginBottom: '20px',
              backgroundColor: '#0f0f1a',
              padding: '4px',
              borderRadius: '8px',
              width: 'fit-content',
            }}>
              {(['normal', 'gold', 'corrupted'] as ChartVariant[]).map((variant) => (
                <button
                  key={variant}
                  onClick={() => setChartVariant(variant)}
                  style={{
                    padding: '10px 24px',
                    backgroundColor: chartVariant === variant ? (
                      variant === 'normal' ? '#4ade80' :
                      variant === 'gold' ? '#ffd700' :
                      '#9333ea'
                    ) : 'transparent',
                    color: chartVariant === variant ? '#1a1a2e' : '#888',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    fontSize: '14px',
                    textTransform: 'capitalize',
                    transition: 'all 0.2s',
                  }}
                >
                  {variant}
                </button>
              ))}
            </div>

            {/* Rarity Labels */}
            <div style={{
              display: 'flex',
              gap: '12px',
              marginBottom: '12px',
              flexWrap: 'wrap',
            }}>
              {[
                { label: 'Common (A-J)', color: CHART_RARITY_COLORS.common.bg },
                { label: 'Uncommon (K-P)', color: CHART_RARITY_COLORS.uncommon.bg },
                { label: 'Rare (Q-U)', color: CHART_RARITY_COLORS.rare.bg },
                { label: 'Legendary (V-X)', color: CHART_RARITY_COLORS.legendary.bg },
                { label: 'Mythic (Y)', color: CHART_RARITY_COLORS.mythic.bg },
                { label: 'Unique (Z)', color: CHART_RARITY_COLORS.unique.bg },
              ].map(({ label, color }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{
                    width: '16px',
                    height: '16px',
                    backgroundColor: color,
                    borderRadius: '3px',
                  }} />
                  <span style={{ color: '#888', fontSize: '12px' }}>{label}</span>
                </div>
              ))}
            </div>

            {/* Grid Container */}
            <div style={{
              overflowX: 'auto',
              paddingBottom: '20px',
            }}>
              {/* Column Headers */}
              <div style={{
                display: 'flex',
                marginLeft: '32px',
                marginBottom: '4px',
              }}>
                {CHART_COLUMNS.map((col) => (
                  <div
                    key={col}
                    style={{
                      width: '48px',
                      textAlign: 'center',
                      color: '#666',
                      fontSize: '11px',
                      fontWeight: 'bold',
                    }}
                  >
                    {col}
                  </div>
                ))}
              </div>

              {/* Grid Rows */}
              {CHART_ROWS.map((row) => (
                <div key={row} style={{ display: 'flex', alignItems: 'center', marginBottom: '2px' }}>
                  {/* Row Label */}
                  <div style={{
                    width: '28px',
                    textAlign: 'center',
                    color: '#666',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    marginRight: '4px',
                  }}>
                    {row}
                  </div>

                  {/* Cells */}
                  {CHART_COLUMNS.map((col) => {
                    const rarity = getColumnRarity(col)
                    const colors = CHART_RARITY_COLORS[rarity]
                    const variantSuffix = chartVariant === 'normal' ? 'N' : chartVariant === 'gold' ? 'G' : 'C'
                    const cellCode = `${col}${row}${variantSuffix}`

                    return (
                      <div
                        key={`${col}${row}`}
                        style={{
                          width: '46px',
                          height: '46px',
                          backgroundColor: colors.bg,
                          border: `2px solid ${colors.border}`,
                          borderRadius: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          margin: '1px',
                          cursor: 'pointer',
                          transition: 'transform 0.1s, box-shadow 0.1s',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'scale(1.05)'
                          e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'scale(1)'
                          e.currentTarget.style.boxShadow = 'none'
                        }}
                      >
                        <span style={{
                          color: '#1a1a2e',
                          fontSize: '10px',
                          fontWeight: 'bold',
                          textShadow: '0 1px 1px rgba(255,255,255,0.3)',
                        }}>
                          {cellCode}
                        </span>
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>

            {/* Info */}
            <p style={{ color: '#666', fontSize: '12px', marginTop: '16px' }}>
              Total cells: {CHART_COLUMNS.length * CHART_ROWS.length} per variant ({CHART_COLUMNS.length * CHART_ROWS.length * 3} total across all variants)
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
