const CONST_TIMEZONES = [
  {
    label: 'Asia/Kabul (Afghanistan)',
  },
  {
    label: 'Europe/Tirane (Albania)',
  },
  {
    label: 'Africa/Algiers (Algeria)',
  },
  {
    label: 'Pacific/Pago_Pago (American Samoa)',
  },
  {
    label: 'Europe/Andorra (Andorra)',
  },
  {
    label: 'Africa/Luanda (Angola)',
  },
  {
    label: 'America/Anguilla (Anguilla)',
  },
  {
    label: 'Antarctica/Casey (Antarctica)',
  },
  {
    label: 'Antarctica/Davis (Antarctica)',
  },
  {
    label: 'Antarctica/DumontDUrville (Antarctica)',
  },
  {
    label: 'Antarctica/Mawson (Antarctica)',
  },
  {
    label: 'Antarctica/McMurdo (Antarctica)',
  },
  {
    label: 'Antarctica/Palmer (Antarctica)',
  },
  {
    label: 'Antarctica/Rothera (Antarctica)',
  },
  {
    label: 'Antarctica/Syowa (Antarctica)',
  },
  {
    label: 'Antarctica/Troll (Antarctica)',
  },
  {
    label: 'Antarctica/Vostok (Antarctica)',
  },
  {
    label: 'America/Antigua (Antigua and Barbuda)',
  },
  {
    label: 'America/Argentina/Buenos_Aires (Argentina)',
  },
  {
    label: 'America/Argentina/Catamarca (Argentina)',
  },
  {
    label: 'America/Argentina/Cordoba (Argentina)',
  },
  {
    label: 'America/Argentina/Jujuy (Argentina)',
  },
  {
    label: 'America/Argentina/La_Rioja (Argentina)',
  },
  {
    label: 'America/Argentina/Mendoza (Argentina)',
  },
  {
    label: 'America/Argentina/Rio_Gallegos (Argentina)',
  },
  {
    label: 'America/Argentina/Salta (Argentina)',
  },
  {
    label: 'America/Argentina/San_Juan (Argentina)',
  },
  {
    label: 'America/Argentina/San_Luis (Argentina)',
  },
  {
    label: 'America/Argentina/Tucuman (Argentina)',
  },
  {
    label: 'America/Argentina/Ushuaia (Argentina)',
  },
  {
    label: 'Asia/Yerevan (Armenia)',
  },
  {
    label: 'America/Aruba (Aruba)',
  },
  {
    label: 'Antarctica/Macquarie (Australia)',
  },
  {
    label: 'Australia/Adelaide (Australia)',
  },
  {
    label: 'Australia/Brisbane (Australia)',
  },
  {
    label: 'Australia/Broken_Hill (Australia)',
  },
  {
    label: 'Australia/Darwin (Australia)',
  },
  {
    label: 'Australia/Eucla (Australia)',
  },
  {
    label: 'Australia/Hobart (Australia)',
  },
  {
    label: 'Australia/Lindeman (Australia)',
  },
  {
    label: 'Australia/Lord_Howe (Australia)',
  },
  {
    label: 'Australia/Melbourne (Australia)',
  },
  {
    label: 'Australia/Perth (Australia)',
  },
  {
    label: 'Australia/Sydney (Australia)',
  },
  {
    label: 'Europe/Vienna (Austria)',
  },
  {
    label: 'Asia/Baku (Azerbaijan)',
  },
  {
    label: 'America/Nassau (Bahamas)',
  },
  {
    label: 'Asia/Bahrain (Bahrain)',
  },
  {
    label: 'Asia/Dhaka (Bangladesh)',
  },
  {
    label: 'America/Barbados (Barbados)',
  },
  {
    label: 'Europe/Minsk (Belarus)',
  },
  {
    label: 'Europe/Brussels (Belgium)',
  },
  {
    label: 'America/Belize (Belize)',
  },
  {
    label: 'Africa/Porto-Novo (Benin)',
  },
  {
    label: 'Atlantic/Bermuda (Bermuda)',
  },
  {
    label: 'Asia/Thimphu (Bhutan)',
  },
  {
    label: 'America/La_Paz (Bolivia, Plurinational State of)',
  },
  {
    label: 'America/Kralendijk (Bonaire, Sint Eustatius and Saba)',
  },
  {
    label: 'Europe/Sarajevo (Bosnia and Herzegovina)',
  },
  {
    label: 'Africa/Gaborone (Botswana)',
  },
  {
    label: 'America/Araguaina (Brazil)',
  },
  {
    label: 'America/Bahia (Brazil)',
  },
  {
    label: 'America/Belem (Brazil)',
  },
  {
    label: 'America/Boa_Vista (Brazil)',
  },
  {
    label: 'America/Campo_Grande (Brazil)',
  },
  {
    label: 'America/Cuiaba (Brazil)',
  },
  {
    label: 'America/Eirunepe (Brazil)',
  },
  {
    label: 'America/Fortaleza (Brazil)',
  },
  {
    label: 'America/Maceio (Brazil)',
  },
  {
    label: 'America/Manaus (Brazil)',
  },
  {
    label: 'America/Noronha (Brazil)',
  },
  {
    label: 'America/Porto_Velho (Brazil)',
  },
  {
    label: 'America/Recife (Brazil)',
  },
  {
    label: 'America/Rio_Branco (Brazil)',
  },
  {
    label: 'America/Santarem (Brazil)',
  },
  {
    label: 'America/Sao_Paulo (Brazil)',
  },
  {
    label: 'Indian/Chagos (British Indian Ocean Territory)',
  },
  {
    label: 'Asia/Brunei (Brunei Darussalam)',
  },
  {
    label: 'Europe/Sofia (Bulgaria)',
  },
  {
    label: 'Africa/Ouagadougou (Burkina Faso)',
  },
  {
    label: 'Africa/Bujumbura (Burundi)',
  },
  {
    label: 'Asia/Phnom_Penh (Cambodia)',
  },
  {
    label: 'Africa/Douala (Cameroon)',
  },
  {
    label: 'America/Atikokan (Canada)',
  },
  {
    label: 'America/Blanc-Sablon (Canada)',
  },
  {
    label: 'America/Cambridge_Bay (Canada)',
  },
  {
    label: 'America/Creston (Canada)',
  },
  {
    label: 'America/Dawson (Canada)',
  },
  {
    label: 'America/Dawson_Creek (Canada)',
  },
  {
    label: 'America/Edmonton (Canada)',
  },
  {
    label: 'America/Fort_Nelson (Canada)',
  },
  {
    label: 'America/Glace_Bay (Canada)',
  },
  {
    label: 'America/Goose_Bay (Canada)',
  },
  {
    label: 'America/Halifax (Canada)',
  },
  {
    label: 'America/Inuvik (Canada)',
  },
  {
    label: 'America/Iqaluit (Canada)',
  },
  {
    label: 'America/Moncton (Canada)',
  },
  {
    label: 'America/Rankin_Inlet (Canada)',
  },
  {
    label: 'America/Regina (Canada)',
  },
  {
    label: 'America/Resolute (Canada)',
  },
  {
    label: 'America/St_Johns (Canada)',
  },
  {
    label: 'America/Swift_Current (Canada)',
  },
  {
    label: 'America/Toronto (Canada)',
  },
  {
    label: 'America/Vancouver (Canada)',
  },
  {
    label: 'America/Whitehorse (Canada)',
  },
  {
    label: 'America/Winnipeg (Canada)',
  },
  {
    label: 'Atlantic/Cape_Verde (Cape Verde)',
  },
  {
    label: 'America/Cayman (Cayman Islands)',
  },
  {
    label: 'Africa/Bangui (Central African Republic)',
  },
  {
    label: 'Africa/Ndjamena (Chad)',
  },
  {
    label: 'America/Punta_Arenas (Chile)',
  },
  {
    label: 'America/Santiago (Chile)',
  },
  {
    label: 'Pacific/Easter (Chile)',
  },
  {
    label: 'Asia/Shanghai (China)',
  },
  {
    label: 'Asia/Urumqi (China)',
  },
  {
    label: 'Indian/Christmas (Christmas Island)',
  },
  {
    label: 'Indian/Cocos (Cocos (Keeling) Islands)',
  },
  {
    label: 'America/Bogota (Colombia)',
  },
  {
    label: 'Indian/Comoro (Comoros)',
  },
  {
    label: 'Africa/Brazzaville (Congo)',
  },
  {
    label: 'Africa/Kinshasa (Congo, the Democratic Republic of the)',
  },
  {
    label: 'Africa/Lubumbashi (Congo, the Democratic Republic of the)',
  },
  {
    label: 'Pacific/Rarotonga (Cook Islands)',
  },
  {
    label: 'America/Costa_Rica (Costa Rica)',
  },
  {
    label: 'Europe/Zagreb (Croatia)',
  },
  {
    label: 'America/Havana (Cuba)',
  },
  {
    label: 'America/Curacao (Curaçao)',
  },
  {
    label: 'Asia/Famagusta (Cyprus)',
  },
  {
    label: 'Asia/Nicosia (Cyprus)',
  },
  {
    label: 'Europe/Prague (Czech Republic)',
  },
  {
    label: "Africa/Abidjan (Côte d'Ivoire)",
  },
  {
    label: 'Europe/Copenhagen (Denmark)',
  },
  {
    label: 'Africa/Djibouti (Djibouti)',
  },
  {
    label: 'America/Dominica (Dominica)',
  },
  {
    label: 'America/Santo_Domingo (Dominican Republic)',
  },
  {
    label: 'America/Guayaquil (Ecuador)',
  },
  {
    label: 'Pacific/Galapagos (Ecuador)',
  },
  {
    label: 'Africa/Cairo (Egypt)',
  },
  {
    label: 'America/El_Salvador (El Salvador)',
  },
  {
    label: 'Africa/Malabo (Equatorial Guinea)',
  },
  {
    label: 'Africa/Asmara (Eritrea)',
  },
  {
    label: 'Europe/Tallinn (Estonia)',
  },
  {
    label: 'Africa/Addis_Ababa (Ethiopia)',
  },
  {
    label: 'Atlantic/Stanley (Falkland Islands (Malvinas))',
  },
  {
    label: 'Atlantic/Faroe (Faroe Islands)',
  },
  {
    label: 'Pacific/Fiji (Fiji)',
  },
  {
    label: 'Europe/Helsinki (Finland)',
  },
  {
    label: 'Europe/Paris (France)',
  },
  {
    label: 'America/Cayenne (French Guiana)',
  },
  {
    label: 'Pacific/Gambier (French Polynesia)',
  },
  {
    label: 'Pacific/Marquesas (French Polynesia)',
  },
  {
    label: 'Pacific/Tahiti (French Polynesia)',
  },
  {
    label: 'Indian/Kerguelen (French Southern Territories)',
  },
  {
    label: 'Africa/Libreville (Gabon)',
  },
  {
    label: 'Africa/Banjul (Gambia)',
  },
  {
    label: 'Asia/Tbilisi (Georgia)',
  },
  {
    label: 'Europe/Berlin (Germany)',
  },
  {
    label: 'Europe/Busingen (Germany)',
  },
  {
    label: 'Africa/Accra (Ghana)',
  },
  {
    label: 'Europe/Gibraltar (Gibraltar)',
  },
  {
    label: 'Europe/Athens (Greece)',
  },
  {
    label: 'America/Danmarkshavn (Greenland)',
  },
  {
    label: 'America/Nuuk (Greenland)',
  },
  {
    label: 'America/Scoresbysund (Greenland)',
  },
  {
    label: 'America/Thule (Greenland)',
  },
  {
    label: 'America/Grenada (Grenada)',
  },
  {
    label: 'America/Guadeloupe (Guadeloupe)',
  },
  {
    label: 'Pacific/Guam (Guam)',
  },
  {
    label: 'America/Guatemala (Guatemala)',
  },
  {
    label: 'Europe/Guernsey (Guernsey)',
  },
  {
    label: 'Africa/Conakry (Guinea)',
  },
  {
    label: 'Africa/Bissau (Guinea-Bissau)',
  },
  {
    label: 'America/Guyana (Guyana)',
  },
  {
    label: 'America/Port-au-Prince (Haiti)',
  },
  {
    label: 'Europe/Vatican (Holy See (Vatican City State))',
  },
  {
    label: 'America/Tegucigalpa (Honduras)',
  },
  {
    label: 'Asia/Hong_Kong (Hong Kong)',
  },
  {
    label: 'Europe/Budapest (Hungary)',
  },
  {
    label: 'Atlantic/Reykjavik (Iceland)',
  },
  {
    label: 'Asia/Kolkata (India)',
  },
  {
    label: 'Asia/Jakarta (Indonesia)',
  },
  {
    label: 'Asia/Jayapura (Indonesia)',
  },
  {
    label: 'Asia/Makassar (Indonesia)',
  },
  {
    label: 'Asia/Pontianak (Indonesia)',
  },
  {
    label: 'Asia/Tehran (Iran, Islamic Republic of)',
  },
  {
    label: 'Asia/Baghdad (Iraq)',
  },
  {
    label: 'Europe/Dublin (Ireland)',
  },
  {
    label: 'Europe/Isle_of_Man (Isle of Man)',
  },
  {
    label: 'Asia/Jerusalem (Israel)',
  },
  {
    label: 'Europe/Rome (Italy)',
  },
  {
    label: 'America/Jamaica (Jamaica)',
  },
  {
    label: 'Asia/Tokyo (Japan)',
  },
  {
    label: 'Europe/Jersey (Jersey)',
  },
  {
    label: 'Asia/Amman (Jordan)',
  },
  {
    label: 'Asia/Almaty (Kazakhstan)',
  },
  {
    label: 'Asia/Aqtau (Kazakhstan)',
  },
  {
    label: 'Asia/Aqtobe (Kazakhstan)',
  },
  {
    label: 'Asia/Atyrau (Kazakhstan)',
  },
  {
    label: 'Asia/Oral (Kazakhstan)',
  },
  {
    label: 'Asia/Qostanay (Kazakhstan)',
  },
  {
    label: 'Asia/Qyzylorda (Kazakhstan)',
  },
  {
    label: 'Africa/Nairobi (Kenya)',
  },
  {
    label: 'Pacific/Kanton (Kiribati)',
  },
  {
    label: 'Pacific/Kiritimati (Kiribati)',
  },
  {
    label: 'Pacific/Tarawa (Kiribati)',
  },
  {
    label: "Asia/Pyongyang (Korea, Democratic People's Republic of)",
  },
  {
    label: 'Asia/Seoul (Korea, Republic of)',
  },
  {
    label: 'Asia/Kuwait (Kuwait)',
  },
  {
    label: 'Asia/Bishkek (Kyrgyzstan)',
  },
  {
    label: "Asia/Vientiane (Lao People's Democratic Republic)",
  },
  {
    label: 'Europe/Riga (Latvia)',
  },
  {
    label: 'Asia/Beirut (Lebanon)',
  },
  {
    label: 'Africa/Maseru (Lesotho)',
  },
  {
    label: 'Africa/Monrovia (Liberia)',
  },
  {
    label: 'Africa/Tripoli (Libya)',
  },
  {
    label: 'Europe/Vaduz (Liechtenstein)',
  },
  {
    label: 'Europe/Vilnius (Lithuania)',
  },
  {
    label: 'Europe/Luxembourg (Luxembourg)',
  },
  {
    label: 'Asia/Macau (Macao)',
  },
  {
    label: 'Europe/Skopje (Macedonia, the Former Yugoslav Republic of)',
  },
  {
    label: 'Indian/Antananarivo (Madagascar)',
  },
  {
    label: 'Africa/Blantyre (Malawi)',
  },
  {
    label: 'Asia/Kuala_Lumpur (Malaysia)',
  },
  {
    label: 'Asia/Kuching (Malaysia)',
  },
  {
    label: 'Indian/Maldives (Maldives)',
  },
  {
    label: 'Africa/Bamako (Mali)',
  },
  {
    label: 'Europe/Malta (Malta)',
  },
  {
    label: 'Pacific/Kwajalein (Marshall Islands)',
  },
  {
    label: 'Pacific/Majuro (Marshall Islands)',
  },
  {
    label: 'America/Martinique (Martinique)',
  },
  {
    label: 'Africa/Nouakchott (Mauritania)',
  },
  {
    label: 'Indian/Mauritius (Mauritius)',
  },
  {
    label: 'Indian/Mayotte (Mayotte)',
  },
  {
    label: 'America/Bahia_Banderas (Mexico)',
  },
  {
    label: 'America/Cancun (Mexico)',
  },
  {
    label: 'America/Chihuahua (Mexico)',
  },
  {
    label: 'America/Ciudad_Juarez (Mexico)',
  },
  {
    label: 'America/Hermosillo (Mexico)',
  },
  {
    label: 'America/Matamoros (Mexico)',
  },
  {
    label: 'America/Mazatlan (Mexico)',
  },
  {
    label: 'America/Merida (Mexico)',
  },
  {
    label: 'America/Mexico_City (Mexico)',
  },
  {
    label: 'America/Monterrey (Mexico)',
  },
  {
    label: 'America/Ojinaga (Mexico)',
  },
  {
    label: 'America/Tijuana (Mexico)',
  },
  {
    label: 'Pacific/Chuuk (Micronesia, Federated States of)',
  },
  {
    label: 'Pacific/Kosrae (Micronesia, Federated States of)',
  },
  {
    label: 'Pacific/Pohnpei (Micronesia, Federated States of)',
  },
  {
    label: 'Europe/Chisinau (Moldova, Republic of)',
  },
  {
    label: 'Europe/Monaco (Monaco)',
  },
  {
    label: 'Asia/Choibalsan (Mongolia)',
  },
  {
    label: 'Asia/Hovd (Mongolia)',
  },
  {
    label: 'Asia/Ulaanbaatar (Mongolia)',
  },
  {
    label: 'Europe/Podgorica (Montenegro)',
  },
  {
    label: 'America/Montserrat (Montserrat)',
  },
  {
    label: 'Africa/Casablanca (Morocco)',
  },
  {
    label: 'Africa/El_Aaiun (Morocco)',
  },
  {
    label: 'Africa/Maputo (Mozambique)',
  },
  {
    label: 'Asia/Yangon (Myanmar)',
  },
  {
    label: 'Africa/Windhoek (Namibia)',
  },
  {
    label: 'Pacific/Nauru (Nauru)',
  },
  {
    label: 'Asia/Kathmandu (Nepal)',
  },
  {
    label: 'Europe/Amsterdam (Netherlands)',
  },
  {
    label: 'Pacific/Noumea (New Caledonia)',
  },
  {
    label: 'Pacific/Auckland (New Zealand)',
  },
  {
    label: 'Pacific/Chatham (New Zealand)',
  },
  {
    label: 'America/Managua (Nicaragua)',
  },
  {
    label: 'Africa/Niamey (Niger)',
  },
  {
    label: 'Africa/Lagos (Nigeria)',
  },
  {
    label: 'Pacific/Niue (Niue)',
  },
  {
    label: 'Pacific/Norfolk (Norfolk Island)',
  },
  {
    label: 'Pacific/Saipan (Northern Mariana Islands)',
  },
  {
    label: 'Europe/Oslo (Norway)',
  },
  {
    label: 'Asia/Muscat (Oman)',
  },
  {
    label: 'Asia/Karachi (Pakistan)',
  },
  {
    label: 'Pacific/Palau (Palau)',
  },
  {
    label: 'Asia/Gaza (Palestine, State of)',
  },
  {
    label: 'Asia/Hebron (Palestine, State of)',
  },
  {
    label: 'America/Panama (Panama)',
  },
  {
    label: 'Pacific/Bougainville (Papua New Guinea)',
  },
  {
    label: 'Pacific/Port_Moresby (Papua New Guinea)',
  },
  {
    label: 'America/Asuncion (Paraguay)',
  },
  {
    label: 'America/Lima (Peru)',
  },
  {
    label: 'Asia/Manila (Philippines)',
  },
  {
    label: 'Pacific/Pitcairn (Pitcairn)',
  },
  {
    label: 'Europe/Warsaw (Poland)',
  },
  {
    label: 'Atlantic/Azores (Portugal)',
  },
  {
    label: 'Atlantic/Madeira (Portugal)',
  },
  {
    label: 'Europe/Lisbon (Portugal)',
  },
  {
    label: 'America/Puerto_Rico (Puerto Rico)',
  },
  {
    label: 'Asia/Qatar (Qatar)',
  },
  {
    label: 'Europe/Bucharest (Romania)',
  },
  {
    label: 'Asia/Anadyr (Russian Federation)',
  },
  {
    label: 'Asia/Barnaul (Russian Federation)',
  },
  {
    label: 'Asia/Chita (Russian Federation)',
  },
  {
    label: 'Asia/Irkutsk (Russian Federation)',
  },
  {
    label: 'Asia/Kamchatka (Russian Federation)',
  },
  {
    label: 'Asia/Khandyga (Russian Federation)',
  },
  {
    label: 'Asia/Krasnoyarsk (Russian Federation)',
  },
  {
    label: 'Asia/Magadan (Russian Federation)',
  },
  {
    label: 'Asia/Novokuznetsk (Russian Federation)',
  },
  {
    label: 'Asia/Novosibirsk (Russian Federation)',
  },
  {
    label: 'Asia/Omsk (Russian Federation)',
  },
  {
    label: 'Asia/Sakhalin (Russian Federation)',
  },
  {
    label: 'Asia/Srednekolymsk (Russian Federation)',
  },
  {
    label: 'Asia/Tomsk (Russian Federation)',
  },
  {
    label: 'Asia/Ust-Nera (Russian Federation)',
  },
  {
    label: 'Asia/Vladivostok (Russian Federation)',
  },
  {
    label: 'Asia/Yakutsk (Russian Federation)',
  },
  {
    label: 'Asia/Yekaterinburg (Russian Federation)',
  },
  {
    label: 'Europe/Astrakhan (Russian Federation)',
  },
  {
    label: 'Europe/Kaliningrad (Russian Federation)',
  },
  {
    label: 'Europe/Kirov (Russian Federation)',
  },
  {
    label: 'Europe/Moscow (Russian Federation)',
  },
  {
    label: 'Europe/Samara (Russian Federation)',
  },
  {
    label: 'Europe/Saratov (Russian Federation)',
  },
  {
    label: 'Europe/Ulyanovsk (Russian Federation)',
  },
  {
    label: 'Europe/Volgograd (Russian Federation)',
  },
  {
    label: 'Africa/Kigali (Rwanda)',
  },
  {
    label: 'Indian/Reunion (Réunion)',
  },
  {
    label: 'America/St_Barthelemy (Saint Barthélemy)',
  },
  {
    label: 'Atlantic/St_Helena (Saint Helena, Ascension and Tristan da Cunha)',
  },
  {
    label: 'America/St_Kitts (Saint Kitts and Nevis)',
  },
  {
    label: 'America/St_Lucia (Saint Lucia)',
  },
  {
    label: 'America/Marigot (Saint Martin (French part))',
  },
  {
    label: 'America/Miquelon (Saint Pierre and Miquelon)',
  },
  {
    label: 'America/St_Vincent (Saint Vincent and the Grenadines)',
  },
  {
    label: 'Pacific/Apia (Samoa)',
  },
  {
    label: 'Europe/San_Marino (San Marino)',
  },
  {
    label: 'Africa/Sao_Tome (Sao Tome and Principe)',
  },
  {
    label: 'Asia/Riyadh (Saudi Arabia)',
  },
  {
    label: 'Africa/Dakar (Senegal)',
  },
  {
    label: 'Europe/Belgrade (Serbia)',
  },
  {
    label: 'Indian/Mahe (Seychelles)',
  },
  {
    label: 'Africa/Freetown (Sierra Leone)',
  },
  {
    label: 'Asia/Singapore (Singapore)',
  },
  {
    label: 'America/Lower_Princes (Sint Maarten (Dutch part))',
  },
  {
    label: 'Europe/Bratislava (Slovakia)',
  },
  {
    label: 'Europe/Ljubljana (Slovenia)',
  },
  {
    label: 'Pacific/Guadalcanal (Solomon Islands)',
  },
  {
    label: 'Africa/Mogadishu (Somalia)',
  },
  {
    label: 'Africa/Johannesburg (South Africa)',
  },
  {
    label:
      'Atlantic/South_Georgia (South Georgia and the South Sandwich Islands)',
  },
  {
    label: 'Africa/Juba (South Sudan)',
  },
  {
    label: 'Africa/Ceuta (Spain)',
  },
  {
    label: 'Atlantic/Canary (Spain)',
  },
  {
    label: 'Europe/Madrid (Spain)',
  },
  {
    label: 'Asia/Colombo (Sri Lanka)',
  },
  {
    label: 'Africa/Khartoum (Sudan)',
  },
  {
    label: 'America/Paramaribo (Suriname)',
  },
  {
    label: 'Arctic/Longyearbyen (Svalbard and Jan Mayen)',
  },
  {
    label: 'Africa/Mbabane (Swaziland)',
  },
  {
    label: 'Europe/Stockholm (Sweden)',
  },
  {
    label: 'Europe/Zurich (Switzerland)',
  },
  {
    label: 'Asia/Damascus (Syrian Arab Republic)',
  },
  {
    label: 'Asia/Taipei (Taiwan, Province of China)',
  },
  {
    label: 'Asia/Dushanbe (Tajikistan)',
  },
  {
    label: 'Africa/Dar_es_Salaam (Tanzania, United Republic of)',
  },
  {
    label: 'Asia/Bangkok (Thailand)',
  },
  {
    label: 'Asia/Dili (Timor-Leste)',
  },
  {
    label: 'Africa/Lome (Togo)',
  },
  {
    label: 'Pacific/Fakaofo (Tokelau)',
  },
  {
    label: 'Pacific/Tongatapu (Tonga)',
  },
  {
    label: 'America/Port_of_Spain (Trinidad and Tobago)',
  },
  {
    label: 'Africa/Tunis (Tunisia)',
  },
  {
    label: 'Europe/Istanbul (Turkey)',
  },
  {
    label: 'Asia/Ashgabat (Turkmenistan)',
  },
  {
    label: 'America/Grand_Turk (Turks and Caicos Islands)',
  },
  {
    label: 'Pacific/Funafuti (Tuvalu)',
  },
  {
    label: 'Africa/Kampala (Uganda)',
  },
  {
    label: 'Europe/Kyiv (Ukraine)',
  },
  {
    label: 'Europe/Simferopol (Ukraine)',
  },
  {
    label: 'Asia/Dubai (United Arab Emirates)',
  },
  {
    label: 'Europe/London (United Kingdom)',
  },
  {
    label: 'America/Adak (United States)',
  },
  {
    label: 'America/Anchorage (United States)',
  },
  {
    label: 'America/Boise (United States)',
  },
  {
    label: 'America/Chicago (United States)',
  },
  {
    label: 'America/Denver (United States)',
  },
  {
    label: 'America/Detroit (United States)',
  },
  {
    label: 'America/Indiana/Indianapolis (United States)',
  },
  {
    label: 'America/Indiana/Knox (United States)',
  },
  {
    label: 'America/Indiana/Marengo (United States)',
  },
  {
    label: 'America/Indiana/Petersburg (United States)',
  },
  {
    label: 'America/Indiana/Tell_City (United States)',
  },
  {
    label: 'America/Indiana/Vevay (United States)',
  },
  {
    label: 'America/Indiana/Vincennes (United States)',
  },
  {
    label: 'America/Indiana/Winamac (United States)',
  },
  {
    label: 'America/Juneau (United States)',
  },
  {
    label: 'America/Kentucky/Louisville (United States)',
  },
  {
    label: 'America/Kentucky/Monticello (United States)',
  },
  {
    label: 'America/Los_Angeles (United States)',
  },
  {
    label: 'America/Menominee (United States)',
  },
  {
    label: 'America/Metlakatla (United States)',
  },
  {
    label: 'America/New_York (United States)',
  },
  {
    label: 'America/Nome (United States)',
  },
  {
    label: 'America/North_Dakota/Beulah (United States)',
  },
  {
    label: 'America/North_Dakota/Center (United States)',
  },
  {
    label: 'America/North_Dakota/New_Salem (United States)',
  },
  {
    label: 'America/Phoenix (United States)',
  },
  {
    label: 'America/Sitka (United States)',
  },
  {
    label: 'America/Yakutat (United States)',
  },
  {
    label: 'Pacific/Honolulu (United States)',
  },
  {
    label: 'Pacific/Midway (United States Minor Outlying Islands)',
  },
  {
    label: 'Pacific/Wake (United States Minor Outlying Islands)',
  },
  {
    label: 'America/Montevideo (Uruguay)',
  },
  {
    label: 'Asia/Samarkand (Uzbekistan)',
  },
  {
    label: 'Asia/Tashkent (Uzbekistan)',
  },
  {
    label: 'Pacific/Efate (Vanuatu)',
  },
  {
    label: 'America/Caracas (Venezuela, Bolivarian Republic of)',
  },
  {
    label: 'Asia/Ho_Chi_Minh (Viet Nam)',
  },
  {
    label: 'America/Tortola (Virgin Islands, British)',
  },
  {
    label: 'America/St_Thomas (Virgin Islands, U.S.)',
  },
  {
    label: 'Pacific/Wallis (Wallis and Futuna)',
  },
  {
    label: 'Asia/Aden (Yemen)',
  },
  {
    label: 'Africa/Lusaka (Zambia)',
  },
  {
    label: 'Africa/Harare (Zimbabwe)',
  },
  {
    label: 'Europe/Mariehamn (Åland Islands)',
  },
  {
    label: 'PST (America)',
  },
  {
    label: 'EST (America)',
  },
  {
    label: 'CST (America)',
  },
  {
    label: 'MST (America)',
  },
];

export default CONST_TIMEZONES;
