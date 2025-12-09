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
  goldValue: number
  goldPerMinute: number
  rarity: Rarity
  imageId?: Id<'_storage'>
  imageUrl?: string
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

type TabType = 'biomes' | 'creatures' | 'decorations'

export function Admin({ onClose }: { onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<TabType>('creatures')
  const [creatures, setCreatures] = useState<CreatureRow[]>([])
  const [biomes, setBiomes] = useState<BiomeRow[]>([])
  const [decorations, setDecorations] = useState<DecorationRow[]>([])
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [saving, setSaving] = useState(false)

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

  // Get sorted creatures
  const getSortedCreatures = (): CreatureRow[] => {
    return [...creatures].sort((a, b) => {
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
            const result = await createCreature({
              name: creature.name,
              biomeId: creature.biomeId,
              goldValue: creature.goldValue,
              goldPerMinute: creature.goldPerMinute,
              rarity: creature.rarity,
              imageId: creature.imageId,
              // Don't save imageUrl - the list query will fetch the real URL from storage
            })
            console.log('[💾SAVE] Created creature with id:', result)
          } else if (creature._id) {
            await updateCreature({
              id: creature._id,
              name: creature.name,
              biomeId: creature.biomeId,
              goldValue: creature.goldValue,
              goldPerMinute: creature.goldPerMinute,
              rarity: creature.rarity,
              imageId: creature.imageId,
            })
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
            await createDecoration({
              name: decoration.name,
              biomeId: decoration.biomeId,
              cost: decoration.cost,
              description: decoration.description,
              imageId: decoration.imageId,
              // Don't save imageUrl - the list query will fetch the real URL from storage
            })
          } else if (decoration._id) {
            await updateDecoration({
              id: decoration._id,
              name: decoration.name,
              biomeId: decoration.biomeId,
              cost: decoration.cost,
              description: decoration.description,
              imageId: decoration.imageId,
            })
          }
        }
      }

      // Reset initialized flag to force reload from database
      // This ensures we get the real image URLs from Convex storage
      setInitialized(false)
      setCreatures([])
      setBiomes([])
      setDecorations([])
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
                              style={{
                                width: '48px',
                                height: '48px',
                                objectFit: 'cover',
                                borderRadius: '4px',
                                border: '1px solid #333',
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
                            style={{
                              width: '48px',
                              height: '48px',
                              objectFit: 'cover',
                              borderRadius: '4px',
                              border: '1px solid #333',
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
      </div>
    </div>
  )
}
