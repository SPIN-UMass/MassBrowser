import Website from '@/models/Website'

export default {
  render: function (h) {
    return h('toggle-button', {
      props: {
        width: 100,
        value: this.website.enabled,
        labels: this.label
      },
      on: {
        change: this.onChange
      }
    })
  },
  props: ['website'],
  data () {
    return {
      label: {checked: 'Proxy', unchecked: "Don't Proxy"}
    }
  },
  methods: {
    onChange: function(e) {
      this.website.enabled = e.value
      Website.update({id: this.website.id}, {$set: {enabled: this.website.enabled}})
    }
  }
}