import { reactive, computed } from 'vue'

export default function (resources, data) {
  let schema = reactive({
    all: resources,
    current: computed(() => resources[data.resourceID]),
  })
  return { schema }
}
