import { reactive, watch, toRef } from 'vue'
import axios from 'axios'

export default function (url) {
  let data = reactive({
    ready: true,
    resourceID: null,
    table: [],
    count: 0,
    page: 1,
    paginationMode: 0,
    search: null,
    error: null,
  })

  function setResource(resID) {
    data.resourceID = resID
    console.log('api.setResource', resID)
  }

  function clearParams() {
    data.page = 1
    data.search = null
  }

  function load() {
    data.table = []
    data.ready = false
    data.count = 0
    parseInt(data.paginationMode) ? _loadAll() : _load()
  }

  async function _load() {
    try {
      const response = await axios.get(url + data.resourceID, {
        params: {
          search: data.search,
          page: data.page > 1 ? data.page : null,
        },
      })
      data.table = response.data.results
      data.count = response.data.count
      data.ready = true
      console.log(
        'api.load: search=%s, page=%d',
        data.search,
        data.page,
        response.config.url
      )
    } catch (error) {
      console.error(error)
    }
  }

  async function _loadAll() {
    let _url = url + data.resourceID
    do {
      try {
        const response = await axios.get(_url)
        data.table.push(...response.data.results)
        data.count = data.table.length
        console.log('api.loadAll: url=%s', _url)
        _url = response.data.next
      } catch (error) {
        console.error(error)
        break
      }
    } while (_url)

    data.ready = true
  }

  watch(toRef(data, 'paginationMode'), (v) => {
    console.log('api.watch(paginationMode)', v, typeof v)
    data.page = 1
    data.search = null
    load()
  })

  return { data, load, setResource, clearParams }
}
