<template lang="pug">
  div
    header
      h1 {{ resource }}
      aside
        template(v-for="v, k in schema")
          u(@click="selectResource(k)") {{ k }}
    table
      tr.header
        template(v-for="k, v in $_schema") 
          th(@click="sortColumn(v)" :class="columnClass(v)" :key="v") {{ v }}
      tr.filter
        template(v-for="k, v in $_schema") 
          td 
            div
              input(type="text" placeholder="Filter" v-model="filter[v]")
              div.clear(@click="clearFilter(v)")
      tr(v-for="row in $_table" :key="row.url")
        template(v-for="k, v in $_schema") 
          td {{ row[k[0]] }}

    div(v-if="!table.length") Loading...
    div.error(v-if="error") {{ error }}
    div.footer(v-else)
      span.count Found: 
        b {{ rowsFound }} 
        template(v-if="!userPagination")
          | of 
          b {{ root.count }}

      span.pages Pages:
        template(v-for="i in $_pages")
          u(@click="goPage(i)" :class="{selected: i==page}") {{ i }}

      span.userPagination(v-if="userPagination")
        | Items: 
        select(v-model.number="itemsPerPage")
          option(value="0") all
          option 5
          option 10
          option 20
          option 30
      
      span
        | Pagination: 
        select(v-model.number="userPagination")
          option(value="0") API
          option(value="1") Client
</template>

<script>
  import axios from 'axios'

  const url = 'https://swapi.dev/api/'
  const schema = {
    films: {
      Title: ['title', String, true],
      Date: ['release_date', Date],
      Episode: ['episode_id', Number],
    },
    people: {
      Name: ['name', String, true],
      Gender: ['gender', String],
      Height: ['height', Number],
      Mass: ['mass', Number],
      Eye: ['eye_color', String],
    },
  }

  export default {
    data() {
      return {
        schema: schema,
        root: {},
        table: [],
        sortedColumn: false,
        sortState: 0,
        filter: {},
        apiSearchString: null,
        resource: 'people',
        page: 1,
        userPagination: 0,
        itemsPerPage: 20,
        rowsFound: 0,
        error: null,
      }
    },

    watch: {
      filter: {
        deep: true,
        handler(v) {
          this.page = 1
        },
      },

      itemsPerPage(v) {
        this.page = 1
      },

      userPagination(v, o) {
        if (v !== o) {
          this.page = 1
          this.table = []
          this.reload()
        }
      },
    },

    computed: {
      // get schema of resource
      $_schema() {
        return schema[this.resource]
      },

      // get schema of sorted column
      $_sortedColumn() {
        return this.$_schema[this.sortedColumn]
      },

      // compute filtered and sorted table
      $_table() {
        let t = this.table
        // filter
        for (let i of Object.keys(this.$_schema)) {
          let col = this.$_schema[i][0]
          let colf = this.filter[i]
          if (colf) {
            if (this.$_schema[i][2] && !this.userPagination) {
              // filter by api
              if (colf !== this.apiSearchString) {
                this.apiSearchString = colf
                this.page = 1
                this.api()
              }
            } else {
              colf = colf.toUpperCase()
              t = t.filter((row) => {
                return ('' + row[col]).toUpperCase().includes(colf)
              })
            }
          } else if (
            this.$_schema[i][2] &&
            this.apiSearchString &&
            !this.userPagination
          ) {
            // filter by api - clear search
            this.apiSearchString = null
            this.api()
          }
        }

        // sort
        if (this.sortedColumn) {
          let [_col, _type] = this.$_sortedColumn
          console.log('sorted', this.sortedColumn, _col, _type)
          t.sort(
            _type === Number
              ? this.sortNumbers
              : _type === Date
              ? this.sortDates
              : this.sortStrings
          )
        }

        // found
        this.rowsFound = t.length

        // client pagination
        if (this.userPagination && this.itemsPerPage > 0) {
          let s = (this.page - 1) * this.itemsPerPage
          t = t.slice(s, s + this.itemsPerPage)
        }

        return t
      },

      // number of pages
      $_pages() {
        return this.root.count
          ? this.userPagination
            ? this.itemsPerPage
              ? Math.ceil(this.rowsFound / this.itemsPerPage)
              : 1
            : Math.ceil(this.root.count / 10)
          : 1
      },
    },

    methods: {
      // api loader
      api() {
        axios
          .get(url + this.resource, {
            params: {
              search: this.apiSearchString,
              page: this.page > 1 ? this.page : null,
            },
          })
          .then((resp) => {
            this.root = resp.data
            this.table = resp.data.results
            this.rowsFound = this.root.count
          })
          .catch((error) => {
            console.log(error)
            this.error = error
          })
      },

      // api loader - load full data
      apiAll(nextUrl) {
        axios
          .get(nextUrl || url + this.resource)
          .then((resp) => {
            this.root = resp.data
            this.table.push(...resp.data.results)
            if (this.root.next) {
              this.apiAll(this.root.next)
            } else {
              this.rowsFound = this.root.count
            }
          })
          .catch((error) => {
            console.log(error)
            this.error = error
          })
      },

      // click handler
      clearFilter(k) {
        this.filter[k] = null
      },

      // helper function for sort strings
      sortStrings(a, b) {
        let k = this.$_sortedColumn[0]
        return this.sortResult(a[k].toUpperCase(), b[k].toUpperCase())
      },

      // helper function for sort dates
      sortDates(a, b) {
        let k = this.$_sortedColumn[0]
        return this.sortResult(new Date(a[k]), new Date(b[k]))
      },

      // helper function for sort numbers
      sortNumbers(a, b) {
        let k = this.$_sortedColumn[0]
        let _a = +a[k]
        let _b = +b[k]
        return this.sortResult(isNaN(_a) ? 0 : _a, isNaN(_b) ? 0 : _b)
      },

      // function for prepare result of sorting helpers
      sortResult(_a, _b) {
        return _a < _b
          ? this.sortState * 2 - 1
          : _a > _b
          ? -this.sortState * 2 + 1
          : 0
      },

      // table header click handler
      sortColumn(col) {
        let [_col, _type] = this.$_schema[col]
        if (col == this.sortedColumn) {
          this.sortState = (1 + this.sortState) % 2
        } else {
          this.sortedColumn = col
          this.sortState = 0
        }
      },

      // get classes for column header
      columnClass(col) {
        if (col == this.sortedColumn)
          return ['sorted', !this.sortState ? 'asc' : 'desc']
      },

      // go to page
      goPage(p) {
        if (this.page != p) {
          console.log('page', p, 'search', this.apiSearchString)
          this.page = p
          if (!this.userPagination) {
            this.api()
          }
        }
      },

      // change data resource
      selectResource(r) {
        this.resource = r
        this.sortedColumn = null
        this.initializeFilters()
        this.reload()
      },

      // full reload
      reload() {
        this.page = 1
        this.table = []
        this.userPagination ? this.apiAll() : this.api()
      },

      // regenerate filters according to schema
      initializeFilters() {
        this.filter = {}
        for (let k in this.$_schema) this.$set(this.filter, k, null)
      },
    },

    created() {
      this.initializeFilters()
      this.reload()
    },
  }
</script>

<style lang="scss">
  .error {
    padding: 10px;
    color: red;
    background: #ffeeee;
  }
  table {
    border-collapse: collapse;
    width: 100%;
    td {
      padding: 2px 5px;
      border: 1px solid #ccc;
    }

    tr.filter td {
      padding: 5px 0;
      border: 0;
      > div {
        display: flex;
        align-items: center;
      }
      .clear::before {
        content: '\2715';
        padding: 0 6px;
        color: red;
        cursor: pointer;
      }
      input {
        flex-grow: 1;
        min-width: 0;
        width: auto;
        box-sizing: border-box;
        border: 1px solid #ccc;
        padding: 2px 5px;
      }
    }

    th {
      cursor: pointer;
      &:hover {
        color: blue;
        text-decoration: underline;
      }
      &.sorted {
        color: blue;
        &.asc::after {
          content: '\2193';
        }
        &.desc::after {
          content: '\2191';
        }
      }
    }
  }
  header {
    display: flex;
    align-items: center;
    h1 {
      flex: 1;
    }
    aside {
      flex: 0 1 auto;
      margin: 0 20px;
      u {
        display: inline-block;
        padding: 5px 10px;
        cursor: pointer;
        color: blue;
      }
    }
  }
  .footer {
    padding: 6px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    > span {
      padding-right: 15px;
    }
    .pages u {
      display: inline-block;
      margin-left: 10px;
      background: #eee;
      width: 1.7rem;
      height: 1.7rem;
      line-height: 1.7rem;
      text-align: center;
      text-decoration: none;
      border-radius: 50%;
      cursor: pointer;
      &.selected {
        background: blue;
        color: #fff;
      }
    }
    select {
      box-sizing: border-box;
      border: 1px solid #ccc;
      padding: 2px 5px;
      background: transparent;
    }
  }
</style>
