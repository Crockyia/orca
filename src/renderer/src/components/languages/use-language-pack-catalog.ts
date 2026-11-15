import { useEffect, useState } from 'react'
import { create } from 'zustand'
import { useShallow } from 'zustand/react/shallow'
import { catalogLanguagePacks, type CatalogLanguagePack } from './language-pack-options'

type LanguagePackCatalog = {
  packs: CatalogLanguagePack[]
  loaded: boolean
  error: boolean
}
const useCatalog = create<LanguagePackCatalog>(() => ({ packs: [], loaded: false, error: false }))

let pending: Promise<LanguagePackCatalog> | null = null

export function loadLanguagePackCatalog(refresh = false): Promise<LanguagePackCatalog> {
  if (pending) {
    return refresh ? pending.then(() => loadLanguagePackCatalog(true)) : pending
  }
  pending = (async () => {
    try {
      if (refresh) {
        await window.api.plugins.refreshMarketplaces({})
      }
      const listings = await window.api.plugins.listMarketplacePlugins()
      useCatalog.setState({ packs: catalogLanguagePacks(listings), loaded: true, error: false })
    } catch {
      useCatalog.setState({ loaded: true, error: true })
    }
    return useCatalog.getState()
  })().finally(() => {
    pending = null
  })
  return pending
}

export function useLanguagePackCatalog(active = true) {
  const state = useCatalog(
    useShallow((state) => ({ packs: state.packs, loaded: state.loaded, error: state.error }))
  )
  const [refreshing, setRefreshing] = useState(false)
  useEffect(() => {
    if (!active) {
      return
    }
    void loadLanguagePackCatalog()
    return window.api.plugins.onChanged((event) => {
      if (event?.contentPacksChanged !== false) {
        void loadLanguagePackCatalog()
      }
    })
  }, [active])
  const refresh = async (): Promise<void> => {
    setRefreshing(true)
    await loadLanguagePackCatalog(true)
    setRefreshing(false)
  }
  return { ...state, refreshing, refresh }
}
