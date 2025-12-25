/** @type {import("stylelint").Config} */
export default {
    plugins: ['stylelint-order'],
    extends: ['stylelint-config-rational-order'],
    rules: {
        'order/properties-order': [],
        'plugin/rational-order': [
            true,
            {
                'border-in-box-model': false,
                'empty-line-between-groups': false,
            },
        ],
    },
}
