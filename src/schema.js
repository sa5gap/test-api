const url = 'https://swapi.dev/api/'
const resourceID = 'films'
const resources = {
  films: {
    title: ['Title', String, true],
    release_date: ['Date', Date],
    episode_id: ['Episode', Number],
  },
  people: {
    name: ['Name', String, true],
    gender: ['Gender', String],
    height: ['Height', Number],
    mass: ['Mass', Number],
    eye_color: ['Eye', String],
  },
}

export { url, resourceID, resources }
