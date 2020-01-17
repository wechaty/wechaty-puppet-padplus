import { log } from '../config'

const phonesRegArray = [{
  location: 'ar_DZ',
  regex: /^(\+?213|0)(5|6|7)\d{8}$/,
}, {
  location: 'ar_SA',
  regex: /^(!?(\+?966)|0)?5\d{8}$/,
}, {
  location: 'ar_SY',
  regex: /^(!?(\+?963)|0)?9\d{8}$/,
}, {
  location: 'cs_CZ',
  regex: /^(\+?420)? ?[1-9][0-9]{2} ?[0-9]{3} ?[0-9]{3}$/,
}, {
  location: 'da_DK',
  regex: /^(\+?45)?(\d{8})$/,
}, {
  location: 'de_DE',
  regex: /^(\+?49[ .-])?([(]{1}[0-9]{1,6}[)])?([0-9 .\-/]{3,20})((x|ext|extension)[ ]?[0-9]{1,4})?$/,
}, {
  location: 'el_GR',
  regex: /^(\+?30)?(69\d{8})$/,
}, {
  location: 'en_AU',
  regex: /^(\+?61|0)4\d{8}$/,
}, {
  location: 'en_GB',
  regex: /^(\+?44|0)7\d{9}$/,
}, {
  location: 'en_HK',
  regex: /^(\+?852-?)?[569]\d{3}-?\d{4}$/,
}, {
  location: 'en_IN',
  regex: /^(\+?91|0)?[789]\d{9}$/,
}, {
  location: 'en_NZ',
  regex: /^(\+?64|0)2\d{7,9}$/,
}, {
  location: 'en_US',
  regex: /^(\+?1)?[2-9]\d{2}[2-9](?!11)\d{6}$/,
}, {
  location: 'en_ZA',
  regex: /^(\+?27|0)\d{9}$/,
}, {
  location: 'en_ZM',
  regex: /^(\+?26)?09[567]\d{7}$/,
}, {
  location: 'es_ES',
  regex: /^(\+?34)?(6\d{1}|7[1234])\d{7}$/,
}, {
  location: 'fi_FI',
  regex: /^(\+?358|0)\s?(4(0|1|2|4|5)?|50)\s?(\d\s?){4,8}\d$/,
}, {
  location: 'fr_FR',
  regex: /^(\+?33|0)[67]\d{8}$/,
}, {
  location: 'he_IL',
  regex: /^(\+972|0)([23489]|5[0248]|77)[1-9]\d{6}/,
}, {
  location: 'hu_HU',
  regex: /^(\+?36)(20|30|70)\d{7}$/,
}, {
  location: 'it_IT',
  regex: /^(\+?39)?\s?3\d{2} ?\d{6,7}$/,
}, {
  location: 'ja_JP',
  regex: /^(\+?81|0)\d{1,4}[ -]?\d{1,4}[ -]?\d{4}$/,
}, {
  location: 'ms_MY',
  regex: /^(\+?6?01){1}(([145]{1}(-|\s)?\d{7,8})|([236789]{1}(\s|-)?\d{7}))$/,
}, {
  location: 'nb_NO',
  regex: /^(\+?47)?[49]\d{7}$/,
}, {
  location: 'nl_BE',
  regex: /^(\+?32|0)4?\d{8}$/,
}, {
  location: 'nn_NO',
  regex: /^(\+?47)?[49]\d{7}$/,
}, {
  location: 'pl_PL',
  regex: /^(\+?48)? ?[5-8]\d ?\d{3} ?\d{2} ?\d{2}$/,
}, {
  location: 'pt_BR',
  regex: /^(\+?55|0)-?[1-9]{2}-?[2-9]{1}\d{3,4}-?\d{4}$/,
}, {
  location: 'pt_PT',
  regex: /^(\+?351)?9[1236]\d{7}$/,
}, {
  location: 'ru_RU',
  regex: /^(\+?7|8)?9\d{9}$/,
}, {
  location: 'sr_RS',
  regex: /^(\+3816|06)[- \d]{5,9}$/,
}, {
  location: 'tr_TR',
  regex: /^(\+?90|0)?5\d{9}$/,
}, {
  location: 'vi_VN',
  regex: /^(\+?84|0)?((1(2([0-9])|6([2-9])|88|99))|(9((?!5)[0-9])))([0-9]{7})$/,
}, {
  location: 'zh_CN',
  regex: /^(\+?0?86-?)?1[345789]\d{9}$/,
}, {
  location: 'zh_TW',
  regex: /^(\+?886-?|0)?9\d{8}$/,
}]

const PRE = 'Util'

export default function checkNumber (phone: string): boolean {
  log.silly(PRE, `checkNumber(${phone})`)

  return phonesRegArray.some(reg => {
    log.silly(PRE, `This phone number maybe belongs to location: ${reg.location}`)
    return phone.match(reg.regex) !== null
  })

}
