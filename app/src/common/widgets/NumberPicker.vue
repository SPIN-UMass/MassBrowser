<template lang="pug">
	.input-group
		span.input-group-btn
			button.btn.btn-minus(@click="minus()") -
		input(type="text" class="number-spinner" v-model="displayVal" readonly)
		.input-group-btn
			button.btn.btn-plus(@click="plus()") +
</template>

<script>
  /* https://github.com/xiaoluoboding/vue-number-spinner */

	export default {
		data () {
			return {
        val: 0,
        displayVal: 0
			}
		},
		props: {
			initialValue: {
				type: Number,
				default: 0
			},
			min: {
				type: Number,
				default: 0
			},
			max: {
				type: Number,
				default: 999
			},
			step: {
        type: [Number, Function],
        default: 1
      },
      formatter: {
        type: Function,
        default: v => v
      }
		},
		created() {
			this.val = this.initialValue
			this.displayVal = this.formatter(this.val)
		},
		methods: {
			plus: function(val) {
				let step = typeof this.step === 'function' ? this.step(this.val) : this.step 
				let newVal = this.val + (val || step)
				if(newVal > this.max) {
					newVal = this.max
				}
				this.val = newVal
				this.$emit('plusOrMinusClicked')				
			},
			minus: function(val) {
				let step = typeof this.step === 'function' ? this.step(this.val) : this.step
				let newVal = this.val - (val || step)
				if(newVal < this.min) {
					newVal = this.min
				}
				this.val = newVal
				this.$emit('plusOrMinusClicked')
			},
			onWheel: function(e) {
				// e.deltaY < 0 ? this.plus() : this.minus()
			}
		},
		watch: {
			val: function(newVal, oldVal) {
				if(newVal < this.min) {
					this.val = this.min
				}
				if(newVal > this.max) {
					this.val = this.max
        }
        
        this.displayVal = this.formatter(this.val)
			}
		}
	}
</script>

<style lang='scss'>
	$number_picker_height: 28px;

	.input-group {
		position: relative;
		display: table;
		border-collapse: separate;
	}

	.input-group-btn {
		position: relative;
		display: table-cell;
		font-size: 0;
		white-space: nowrap;
	}

	.btn {
		display: table-cell;
		font-family: 'Roboto Mono', Monaco, courier, monospace;
		font-weight: 700;
		color: #fff;
		height: $number_picker_height;
		border: none;
		text-align: center;
		padding: 0px 6px;
	}

	.btn-plus {
		/* background-color: #4fc08d; */
		background-color: #1675b2;
	
	}

	.btn-plus:hover {
		/* background-color: #5dc596; */
	}

	.btn-minus {
		background-color: #f66;
	}

	.btn-minus:hover {
		background-color: #f56;
	}

	.number-spinner {
		text-align: center;
		width: 100%;
		height: $number_picker_height;
		line-height: $number_picker_height;
		box-sizing: border-box;
		padding: 6px 10px;
		border: 1px solid #e3e3e3;
		outline: none;
		transition: border-color 0.2s ease;
	}

	.number-spinner:focus {
		border: 1px solid #4fc08d;
	}
</style>