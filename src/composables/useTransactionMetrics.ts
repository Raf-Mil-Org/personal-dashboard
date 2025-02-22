import { computed, ref } from 'vue';
import { useUtils } from './useUtils';

const categorizedCompanies = [
    { name: 'ALBERT HEIJN 1598 AMSTERDAM NLD', category: { name: 'Groceries & household', key: 'groceries_household' } },
    { name: 'SumUp  *Hairstudio de Amsterdam', category: { name: 'Health & Wellness', key: 'health_wellness' } },
    { name: 'DUTY FREE SHOPS THESSALONIKI GRC', category: { name: 'Shopping', key: 'shopping' } },
    { name: 'R MILIOPOULOS CJ', category: { name: 'Other', key: 'other' } },
    { name: 'A. MILIOPOULOU', category: { name: 'Other', key: 'other' } },
    { name: 'BOLT.EU/O/2412300001 Tallinn EST', category: { name: 'Transport & travel', key: 'transport_travel' } },
    { name: 'TO PIKAP LTD THESSALONIKI GRC', category: { name: 'Other', key: 'other' } },
    { name: 'SWEET GARDEN THESSALONIKI GRC', category: { name: 'Other', key: 'other' } },
    { name: 'SALENTO WOOD FIRED S GRC', category: { name: 'Other', key: 'other' } },
    { name: 'FLOCAFE SYKOURI GRC', category: { name: 'Restaurants/Food', key: 'restaurants_food' } },
    { name: 'Savoris Bakery LARISA GRC', category: { name: 'Restaurants/Food', key: 'restaurants_food' } },
    { name: 'Hr N Skarlatos', category: { name: 'Other', key: 'other' } },
    { name: 'DANIKA LARISA LARISA GRC', category: { name: 'Other', key: 'other' } },
    { name: 'Hr R Miliopoulos', category: { name: 'Other', key: 'other' } },
    { name: 'BOLLOCKS LARISA GRC', category: { name: 'Bars', key: 'bars' } },
    { name: 'LALOS VASILIOS LARISA GRC', category: { name: 'Other', key: 'other' } },
    { name: 'PRAKTIKER HELLAS AE LA LARIS GRC', category: { name: 'Other', key: 'other' } },
    { name: 'Hr C Katsiloulis', category: { name: 'Other', key: 'other' } },
    { name: 'KARAFYLLIS K GEORGIO LARISA GRC', category: { name: 'Other', key: 'other' } },
    { name: 'MICHAIL NTAVAS LARISA GRC', category: { name: 'Medical', key: 'medical' } },
    { name: 'V PRIONA K KRIKELI O LARISA GRC', category: { name: 'Other', key: 'other' } },
    { name: 'MEKRAS ALEXANDROS GADI LARIS GRC', category: { name: 'Other', key: 'other' } },
    { name: 'BERSHKA LARISA LARISA GRC', category: { name: 'Other', key: 'other' } },
    { name: 'A TSOGKA', category: { name: 'Other', key: 'other' } },
    { name: 'MOUTSIANAS DIMITRIOS GRC', category: { name: 'Other', key: 'other' } },
    { name: 'TO PICK UP IKE THESSALONIKI GRC', category: { name: 'Other', key: 'other' } },
    { name: 'ROUPAS GEORGIOS THESSALONIKI GRC', category: { name: 'Other', key: 'other' } },
    { name: 'ZIOUTAS ARISTEIDIS THESSALON GRC', category: { name: 'Other', key: 'other' } },
    { name: 'EVEREST THESS KARAMANL GRC', category: { name: 'Other', key: 'other' } },
    { name: 'Mortgage ABN', category: { name: 'Other', key: 'other' } },
    { name: 'GEORGIOS AVGEROS THESSALONIK GRC', category: { name: 'Other', key: 'other' } },
    { name: 'UBR* PENDING.UBER.COM AMSTERDAM', category: { name: 'Transport & travel', key: 'transport_travel' } },
    { name: 'Bruna 2303  Lounge 1 N SCHIPHOL', category: { name: 'Other', key: 'other' } },
    { name: 'Gemeente Amsterdam AMSTERDAM NLD', category: { name: 'Other', key: 'other' } },
    { name: 'DL Zuidas B.V. VIJFHUI NLD', category: { name: 'Restaurants/Food', key: 'restaurants_food' } },
    { name: 'IntoPARTY B.V.', category: { name: 'Other', key: 'other' } },
    { name: 'R. Miliopoulos', category: { name: 'Other', key: 'other' } },
    { name: 'LAB111 AMSTERDAM NLD', category: { name: 'Other', key: 'other' } },
    { name: 'Tzortzis via Tikkie', category: { name: 'Other', key: 'other' } },
    { name: 'Kosten OranjePakket', category: { name: 'Other', key: 'other' } },
    { name: 'Mw A Tsogka', category: { name: 'Other', key: 'other' } },
    { name: 'The Rough Kitchen ZAANDAM NLD', category: { name: 'Other', key: 'other' } },
    { name: 'ALBERT HEIJN 1497 AMSTERDAM NLD', category: { name: 'Groceries & household', key: 'groceries_household' } },
    { name: 'Levenslang Amsterdam B Amsterdam', category: { name: 'Other', key: 'other' } },
    { name: 'NYX*VendingWork Groningen NLD', category: { name: 'Other', key: 'other' } },
    { name: 'Grand Cafe Dickys AMSTERDAM NLD', category: { name: 'Restaurants/Food', key: 'restaurants_food' } },
    { name: 'DIRK VDBROEK FIL3158 AMSTERDAM', category: { name: 'Groceries & household', key: 'groceries_household' } },
    { name: 'Amazon Payments Europe SCA via Stripe Technology Europe Ltd', category: { name: 'Other', key: 'other' } },
    { name: 'Radion Amsterdam B.V. AMSTERDAM', category: { name: 'Bars', key: 'bars' } },
    { name: 'Zettle*Garage Noord B Amsterdam', category: { name: 'Other', key: 'other' } },
    { name: 'DIRK VD BROEKFIL3158 AMSTERDAM', category: { name: 'Groceries & household', key: 'groceries_household' } },
    { name: 'Garage Noord B.V.', category: { name: 'Other', key: 'other' } },
    { name: 'Dicky Squash B.V. AMSTERDAM NLD', category: { name: 'Other', key: 'other' } },
    { name: 'PAY.nl*FilmHallen AMSTERDAM NLD', category: { name: 'Other', key: 'other' } },
    { name: 'Kruidvat 7406 AMSTERDAM NLD', category: { name: 'Other', key: 'other' } },
    { name: 'NUDE BURGER CLUB AMSTERDAM NLD', category: { name: 'Other', key: 'other' } },
    { name: 'LS Bar Jones Amsterdam NLD', category: { name: 'Bars', key: 'bars' } },
    { name: 'SumUp  *Hinata AMSTERDAM NLD', category: { name: 'Other', key: 'other' } },
    { name: 'EASYJET I MANCHESTER GBR', category: { name: 'Other', key: 'other' } },
    { name: 'Dickys Grand Cafe Amsterdam NLD', category: { name: 'Restaurants/Food', key: 'restaurants_food' } },
    { name: 'AERO GLACE MARRAKECH MAR', category: { name: 'Other', key: 'other' } },
    { name: 'HERBORISTE SECRET 3 MARRAKEC MAR', category: { name: 'Other', key: 'other' } },
    { name: 'BELDI FUSION KITCHEN CASABLA MAR', category: { name: 'Other', key: 'other' } },
    { name: 'BEZZATE SHOP OUARZAZATE MAR', category: { name: 'Shopping', key: 'shopping' } },
    { name: 'ALBERT HEIJN 1653 SCHIPHOL NLD', category: { name: 'Groceries & household', key: 'groceries_household' } },
    { name: 'CCV*Lokaal van de Stad AMSTERDAM', category: { name: 'Other', key: 'other' } },
    { name: 'C&M*Hunters III Amsterdam NLD', category: { name: 'Other', key: 'other' } },
    { name: 'C&M*Slok en Slurp Amsterdam NLD', category: { name: 'Other', key: 'other' } },
    { name: 'Zettle*RRVRNT AMSTERDAM NLD', category: { name: 'Other', key: 'other' } },
    { name: 'BCK*Decathlon Amsterda NLD', category: { name: 'Other', key: 'other' } },
    { name: 'ALBERT HEIJN  2236 AMSTERDAM NLD', category: { name: 'Groceries & household', key: 'groceries_household' } },
    { name: 'BAX-SHOP.NL B.V. via Worldline NV/SA', category: { name: 'Shopping', key: 'shopping' } },
    { name: '5861 AH ASDZ AMSTERDAM NLD', category: { name: 'Other', key: 'other' } },
    { name: 'Zero Zero WTC AMSTERDAM NLD', category: { name: 'Restaurants/Food', key: 'restaurants_food' } },
    { name: 'Best Doner JP Heije125 AMSTERDAM', category: { name: 'Other', key: 'other' } },
    { name: 'Amazon Payments Europe SCA', category: { name: 'Other', key: 'other' } },
    { name: 'BCK*Global Trading Com AMSTERDAM', category: { name: 'Other', key: 'other' } },
    { name: 'Cafe Lennep Amsterdam NLD', category: { name: 'Restaurants/Food', key: 'restaurants_food' } },
    { name: 'LOT61 Amsterdam NLD', category: { name: 'Other', key: 'other' } },
    { name: 'BCK*Baxshop.nl B.V. AMSTERDAM', category: { name: 'Shopping', key: 'shopping' } },
    { name: 'VILLA ARENA P4 P5 AMSTERDAM NLD', category: { name: 'Other', key: 'other' } },
    { name: 'Brandstof Amsterdam NLD', category: { name: 'Other', key: 'other' } },
    { name: 'BCK*Mauricebikes Amsterdam NLD', category: { name: 'Other', key: 'other' } },
    { name: 'CCV*Slagerij NieuwSlo AMSTERDAM', category: { name: 'Other', key: 'other' } },
    { name: 'CCV*Night2Night S GRAVENHAGE NLD', category: { name: 'Other', key: 'other' } },
    { name: 'Albert Heijn 1812 AMSTERDAM NLD', category: { name: 'Groceries & household', key: 'groceries_household' } },
    { name: 'GRAAN BV AMSTERDAM NLD', category: { name: 'Other', key: 'other' } },
    { name: 'Stager ticketing', category: { name: 'Other', key: 'other' } },
    { name: 'CCV*RamenRamen AMSTERDAM NLD', category: { name: 'Restaurants/Food', key: 'restaurants_food' } },
    { name: 'Albert Heijn 4055 AMSTERDAM NLD', category: { name: 'Groceries & household', key: 'groceries_household' } },
    { name: 'ALBERT HEIJN 1868 AMSTERDAM NLD', category: { name: 'Groceries & household', key: 'groceries_household' } },
    { name: 'Bloemenhoek Admiraal ABBENES NLD', category: { name: 'Other', key: 'other' } },
    { name: 'Kypriotis via Tikkie', category: { name: 'Other', key: 'other' } },
    { name: 'TILLA TEC AMSTERDAM NLD', category: { name: 'Other', key: 'other' } },
    { name: 'SumUp  *Amsterdams mos Amsterdam', category: { name: 'Other', key: 'other' } },
    { name: 'ALBERT HEIJN 2221 AMSTERDAM NLD', category: { name: 'Groceries & household', key: 'groceries_household' } },
    { name: 'Rrvrnt via Stichting Mollie Payments', category: { name: 'Other', key: 'other' } },
    { name: 'C. Kourounis via Rabo Betaalverzoek', category: { name: 'Other', key: 'other' } },
    { name: 'AH to go AdamZ 5861 AMSTERDAM', category: { name: 'Other', key: 'other' } },
    { name: 'Hr A Takourlis', category: { name: 'Other', key: 'other' } },
    { name: 'Amazon EU SARL via Stripe Technology Europe Ltd', category: { name: 'Other', key: 'other' } },
    { name: 'C&M*Keybox Amsterdam NLD', category: { name: 'Other', key: 'other' } },
    { name: 'Lidl 707 Amsterdam AMSTERDAM NLD', category: { name: 'Groceries & household', key: 'groceries_household' } },
    { name: 'Slagerij Bessaha AMSTERDAM NLD', category: { name: 'Other', key: 'other' } },
    { name: 'bol.com', category: { name: 'Other', key: 'other' } },
    { name: 'Umaimon Takumi Amsterdam NLD', category: { name: 'Other', key: 'other' } },
    { name: 'CCV*OSDORP SLAGERIJ AMSTERDAM', category: { name: 'Other', key: 'other' } },
    { name: 'Strato', category: { name: 'Other', key: 'other' } },
    { name: 'Volendammer Vishande AMSTERDAM', category: { name: 'Other', key: 'other' } },
    { name: 'Papakrivopoulos via Tikkie', category: { name: 'Other', key: 'other' } },
    { name: 'SnowWorldNV', category: { name: 'Other', key: 'other' } },
    { name: 'Zettle*Salvatorica AMSTERDAM NLD', category: { name: 'Other', key: 'other' } },
    { name: 'Massimo Gelato Amsterdam NLD', category: { name: 'Other', key: 'other' } },
    { name: 'HASTA LA VISTA BABY AMSTERDAM', category: { name: 'Other', key: 'other' } },
    { name: 'De Kade B.V. Amsterdam NLD', category: { name: 'Other', key: 'other' } },
    { name: 'LS La Catrina MEXICO Amsterdam', category: { name: 'Other', key: 'other' } },
    { name: 'CCV*Cafe Kosmos AMSTERDAM NLD', category: { name: 'Restaurants/Food', key: 'restaurants_food' } },
    { name: 'Hr O Papasternos', category: { name: 'Other', key: 'other' } },
    { name: 'van Capelle via Tikkie', category: { name: 'Other', key: 'other' } },
    { name: 'RESTAURANT KAI AMSTELVEEN NLD', category: { name: 'Restaurants/Food', key: 'restaurants_food' } },
    { name: 'Biotech-Shop via Stichting Mollie Payments', category: { name: 'Shopping', key: 'shopping' } },
    { name: 'Massimo Gelato Maratho Amsterdam', category: { name: 'Other', key: 'other' } },
    { name: 'Salsa Shop Zuidas Amsterdam NLD', category: { name: 'Shopping', key: 'shopping' } },
    { name: 'Salib via Tikkie', category: { name: 'Other', key: 'other' } },
    { name: 'ZERO ZERO AMSTERDAM NLD', category: { name: 'Restaurants/Food', key: 'restaurants_food' } },
    { name: 'Laddrak Bouquet bv Haarlem NLD', category: { name: 'Other', key: 'other' } },
    { name: 'CCV*BAR WEST BV AMSTERDAM NLD', category: { name: 'Bars', key: 'bars' } },
    { name: 'CCV*t Oude Pothuys B.V UTRECHT', category: { name: 'Other', key: 'other' } },
    { name: 'HEMA EV2152 UTCS UTRECHT NLD', category: { name: 'Other', key: 'other' } },
    { name: 'Pat. Bond & Smolders UTRECHT NLD', category: { name: 'Other', key: 'other' } },
    { name: 'Kambouroudis via Tikkie', category: { name: 'Other', key: 'other' } },
    { name: 'Blokker323 Amsterdam AMSTERDAM', category: { name: 'Other', key: 'other' } },
    { name: 'CCV*BRET AMSTERDAM NLD', category: { name: 'Other', key: 'other' } },
    { name: 'TicketingPayments', category: { name: 'Other', key: 'other' } },
    { name: 'OASA ETICKET POS ATHINA GRC', category: { name: 'Other', key: 'other' } },
    { name: 'RDW', category: { name: 'Other', key: 'other' } },
    { name: 'BAZAAR AE KOUKAKI GRC', category: { name: 'Other', key: 'other' } },
    { name: 'DUTY FREE SHOPS SPATA GRC', category: { name: 'Shopping', key: 'shopping' } },
    { name: 'FARMAKEIO IOANNI CHA GRC', category: { name: 'Other', key: 'other' } },
    { name: 'KOULOURI HOUSE ATHINA GRC', category: { name: 'Other', key: 'other' } },
    { name: 'S MYLONAS KAI SIA OE ATHINA GRC', category: { name: 'Other', key: 'other' } },
    { name: 'K KALYVAS DIM KALYVAS ATHINA GRC', category: { name: 'Other', key: 'other' } },
    { name: 'TO SERBETOSPITO ATHINA GRC', category: { name: 'Other', key: 'other' } },
    { name: 'PARADEISH GEORGIA ASTIPALEA GRC', category: { name: 'Other', key: 'other' } },
    { name: 'BUENISSIMO ASTIPALEA GRC', category: { name: 'Other', key: 'other' } },
    { name: 'I OREA PENTELI PSIRRI GRC', category: { name: 'Other', key: 'other' } },
    { name: 'KERANTHOS ASTIPALEA GRC', category: { name: 'Other', key: 'other' } },
    { name: 'KYRANNOS MIHELIS & AGE ASTIP GRC', category: { name: 'Other', key: 'other' } },
    { name: 'H GONIA TIS GEYSIS ASTIPALEA GRC', category: { name: 'Other', key: 'other' } },
    { name: 'GKATZIOS CHRISTOS ASTIPALEA GRC', category: { name: 'Other', key: 'other' } },
    { name: 'GAZZOU ASTIPALEA GRC', category: { name: 'Other', key: 'other' } },
    { name: 'PENTE DROMOI EXARCHEIA GRC', category: { name: 'Other', key: 'other' } },
    { name: 'SCAMP ATHENS GRC', category: { name: 'Other', key: 'other' } },
    { name: 'LEMONI MINA SKOPELOS GRC', category: { name: 'Other', key: 'other' } },
    { name: 'MANOLIS/MANTALAKI SKOPELOS GRC', category: { name: 'Other', key: 'other' } },
    { name: 'KARVELIS EE SKOPELOS GRC', category: { name: 'Other', key: 'other' } },
    { name: 'FIVGA OLIMBIA SKOPELOS GRC', category: { name: 'Other', key: 'other' } },
    { name: 'YPERASTIKO K T E L N M VOLOS GRC', category: { name: 'Other', key: 'other' } },
    { name: 'ALEXANDROS GEORGIOU SKOPELOS GRC', category: { name: 'Other', key: 'other' } },
    { name: 'MOYRISIS SPYROS GLOSSA SKOPE GRC', category: { name: 'Other', key: 'other' } },
    { name: 'MANTALAKI SKOPELOS GRC', category: { name: 'Other', key: 'other' } },
    { name: 'NIKOS GLOSSA GRC', category: { name: 'Other', key: 'other' } },
    { name: 'EL ATRIO SKOPELOS GRC', category: { name: 'Other', key: 'other' } },
    { name: 'MINI MARKET SKOPELOS GRC', category: { name: 'Other', key: 'other' } },
    { name: 'ANTONIOU NIK KAI S SKOPELOS GRC', category: { name: 'Other', key: 'other' } },
    { name: 'PROVIAS OE SKOPELOS GRC', category: { name: 'Other', key: 'other' } },
    { name: 'MOURIA SKOPELOU / MA GRC', category: { name: 'Other', key: 'other' } },
    { name: 'GALAXIAS VOLOS 147 VOLOS GRC', category: { name: 'Other', key: 'other' } },
    { name: 'KYKNOS EE VOLOS GRC', category: { name: 'Other', key: 'other' } },
    { name: 'GALANIS NIKOLAOS LARISA GRC', category: { name: 'Other', key: 'other' } },
    { name: 'SERETIDIS VASILEIO LARISA GRC', category: { name: 'Other', key: 'other' } },
    { name: 'PATARLAS MARKOS VOLOS GRC', category: { name: 'Other', key: 'other' } },
    { name: 'KALAMAKI DEKA LARISA GRC', category: { name: 'Other', key: 'other' } },
    { name: 'LOLITA LARISA GRC', category: { name: 'Other', key: 'other' } },
    { name: 'POSIT/TSIAKMAKISFOTIO AGIA GRC', category: { name: 'Other', key: 'other' } },
    { name: 'PIZZA HOT AGIA GRC', category: { name: 'Other', key: 'other' } },
    { name: 'YOLO BEACH TIME AGIA GRC', category: { name: 'Other', key: 'other' } },
    { name: 'KARDARAS IOA EVANGEL AGIOKAB GRC', category: { name: 'Other', key: 'other' } },
    { name: 'DELLAS STAVROS AGIOKABOS AGI GRC', category: { name: 'Other', key: 'other' } },
    { name: 'Revolut**0013* Dublin IRL', category: { name: 'Other', key: 'other' } },
    { name: 'KARDARAS EVANGELOS AGIA GRC', category: { name: 'Other', key: 'other' } },
    { name: 'AB VASILOPOULOS S.A. LARISA GRC', category: { name: 'Other', key: 'other' } },
    { name: 'PSYCHAS  ARISTOTELIS A LARIS GRC', category: { name: 'Other', key: 'other' } },
    { name: 'PLATSIOTI VENIZELOU LARISA GRC', category: { name: 'Other', key: 'other' } },
    { name: 'KONA OLGA LARISA GRC', category: { name: 'Other', key: 'other' } },
    { name: 'TARTAMPOUKAS ATHANASIO LARIS GRC', category: { name: 'Other', key: 'other' } },
    { name: 'SYRMAKEZI ELENI LARISA GRC', category: { name: 'Other', key: 'other' } },
    { name: 'MALLIARA SOFIA LARISA GRC', category: { name: 'Other', key: 'other' } },
    { name: 'SKATESHOPGR LARISA GRC', category: { name: 'Shopping', key: 'shopping' } },
    { name: 'FATTO STO CHERI LARISA GRC', category: { name: 'Other', key: 'other' } },
    { name: 'THEODOSIOU ANAST. LARISA GRC', category: { name: 'Other', key: 'other' } },
    { name: '4ALL 4COFFEE THESSALONIKI GRC', category: { name: 'Other', key: 'other' } },
    { name: 'HM Larissa GRC', category: { name: 'Other', key: 'other' } },
    { name: 'RIZOULIS DIMITRIOS AGIA GRC', category: { name: 'Other', key: 'other' } },
    { name: 'STIN TARATSA THESSALONIKI GRC', category: { name: 'Other', key: 'other' } },
    { name: 'OLYMPIADOS ESTIASI OE GRC', category: { name: 'Other', key: 'other' } },
    { name: 'YES STORES THESSALONIKI GRC', category: { name: 'Shopping', key: 'shopping' } },
    { name: 'GANAS MICHAIL THESSALONIKI GRC', category: { name: 'Other', key: 'other' } },
    { name: 'Abraxas B.V Amsterdam NLD', category: { name: 'Other', key: 'other' } },
    { name: 'Tikkie', category: { name: 'Other', key: 'other' } },
    { name: 'BCK*Festina Lente AMSTERDAM NLD', category: { name: 'Other', key: 'other' } },
    { name: 'Gall & Gall 6546 AMSTERDAM NLD', category: { name: 'Other', key: 'other' } },
    { name: 'BCK*BR020 B.V. AMSTERDAM NLD', category: { name: 'Other', key: 'other' } },
    { name: 'RAP*Casni BV AMSTERDAM NLD', category: { name: 'Other', key: 'other' } },
    { name: 'Mizubar AMSTERDAM NLD', category: { name: 'Bars', key: 'bars' } },
    { name: 'Bunq B.V.', category: { name: 'Other', key: 'other' } },
    { name: 'A.F.S. B.V. AMSTERDAM NLD', category: { name: 'Other', key: 'other' } },
    { name: 'IKEA Amsterdam AMSTERDAM NLD', category: { name: 'Other', key: 'other' } },
    { name: 'AMZN MKTP NL via Amazon Payments Europe SCA', category: { name: 'Other', key: 'other' } },
    { name: 'Restaurant SenT Amsterdam NLD', category: { name: 'Restaurants/Food', key: 'restaurants_food' } },
    { name: 'CCV*BP PARNASSUSWEG AMSTERDAM', category: { name: 'Other', key: 'other' } },
    { name: 'Bruna 2049 AMSTERDAM NLD', category: { name: 'Other', key: 'other' } },
    { name: '5868 ASD AH to Go AMSTERDAM NLD', category: { name: 'Other', key: 'other' } },
    { name: 'BCK*Balthazars Keuken Amsterdam', category: { name: 'Other', key: 'other' } },
    { name: 'ETOS 7584 AMSTERDAM NLD', category: { name: 'Other', key: 'other' } },
    { name: 'Zettle*Federico Coron AMSTERDAM', category: { name: 'Other', key: 'other' } },
    { name: 'PARDAS BV AMSTERDAM NLD', category: { name: 'Other', key: 'other' } },
    { name: 'Lucas Andreas Apoth AMSTERDAM', category: { name: 'Other', key: 'other' } },
    { name: 'Ox & Bucks AMSTERDAM NLD', category: { name: 'Other', key: 'other' } },
    { name: 'NEU*Vendingland Neede NLD', category: { name: 'Other', key: 'other' } },
    { name: 'CCV*Het Amsterdamsch L AMSTERDAM', category: { name: 'Other', key: 'other' } },
    { name: 'Grillroom Hilal AMSTERDAM NLD', category: { name: 'Other', key: 'other' } },
    { name: 'Eetcafe Sound Garden AMSTERDAM', category: { name: 'Restaurants/Food', key: 'restaurants_food' } },
    { name: 'Bakaliko Amsterdam BV', category: { name: 'Other', key: 'other' } },
    { name: 'Coffeeshop 1e Hulp Amsterdam NLD', category: { name: 'Shopping', key: 'shopping' } },
    { name: 'BK 5125 HJJ8T8 AMSTERDAM NLD', category: { name: 'Other', key: 'other' } },
    { name: 'Jumbo Amsterdam Julian AMSTERDAM', category: { name: 'Other', key: 'other' } },
    { name: 'HMSHost Amsterdam Amst Amsterdam', category: { name: 'Other', key: 'other' } },
    { name: 'CCV*ROYAL FOOK LONG AMSTERDAM', category: { name: 'Other', key: 'other' } },
    { name: 'Amaze AMSTERDAM NLD', category: { name: 'Other', key: 'other' } },
    { name: 'Cafe City Hall BV AMSTERDAM NLD', category: { name: 'Restaurants/Food', key: 'restaurants_food' } },
    { name: 'NYX*ABServiciosSelecta Madri ESP', category: { name: 'Other', key: 'other' } },
    { name: 'LSP*Boom Chicago Amsterdam NLD', category: { name: 'Other', key: 'other' } },
    { name: 'ESSO AMSTERDAM MEER EN AMSTERDAM', category: { name: 'Other', key: 'other' } },
    { name: 'CCV*THE POOLHOLE AMSTERDAM NLD', category: { name: 'Other', key: 'other' } },
    { name: 'CCV*THE POOLBAR AMSTERDAM NLD', category: { name: 'Bars', key: 'bars' } },
    { name: 'SumUp  *Nancy Amsterdam NLD', category: { name: 'Other', key: 'other' } },
    { name: 'Bolt Tallinn EST', category: { name: 'Transport & travel', key: 'transport_travel' } },
    { name: 'Gemeente Amsterdam Belastingen', category: { name: 'Other', key: 'other' } },
    { name: 'NLOVLX5MQ9PYXQE5WG www.ovpay.nl', category: { name: 'Other', key: 'other' } },
    { name: 'Coffeeshop Easy Times Amsterdam', category: { name: 'Shopping', key: 'shopping' } },
    { name: 'PIGI ARTOU E.P.E. ATHINA GRC', category: { name: 'Other', key: 'other' } },
    { name: 'DUTY FREE SPATON  LOUT GRC', category: { name: 'Other', key: 'other' } },
    { name: 'Amazon EU SARL', category: { name: 'Other', key: 'other' } },
    { name: 'TSIMBI ATHINA GRC', category: { name: 'Other', key: 'other' } },
    { name: 'Rabo Betaalverzoek', category: { name: 'Other', key: 'other' } },
    { name: 'OASA ETICKET POS ATIENS GRC', category: { name: 'Other', key: 'other' } },
    { name: 'SEYCHELLES ESTIASI OE ATHINA GRC', category: { name: 'Other', key: 'other' } },
    { name: 'KOUZELI MARIA YIASEMI ATHINA GRC', category: { name: 'Other', key: 'other' } },
    { name: 'E TSAGKRI K SIA EE ANO PETRA GRC', category: { name: 'Other', key: 'other' } },
    { name: 'THANASSIS ATHINA GRC', category: { name: 'Other', key: 'other' } },
    { name: 'LITHOS ATHINA GRC', category: { name: 'Other', key: 'other' } },
    { name: 'FLEIYO ATHINA GRC', category: { name: 'Other', key: 'other' } },
    { name: 'ZOUBERIS GEORGIOS ATHINA GRC', category: { name: 'Transport & travel', key: 'transport_travel' } },
    { name: 'K ANASTASIOU KAI SIA E LARIS GRC', category: { name: 'Other', key: 'other' } },
    { name: 'OPAP ATHENS GRC', category: { name: 'Other', key: 'other' } },
    { name: '', category: { name: 'Other', key: 'other' } }
];

const defaultExpenseCategories = ref([
    { name: 'Fixed expenses', key: 'fixed_expenses' },
    { name: 'Free time', key: 'free_time' },
    { name: 'Groceries & household', key: 'groceries_household' },
    { name: 'Health & Wellness', key: 'health_wellness' },
    { name: 'Medical', key: 'medical' },
    { name: 'Other', key: 'other' },
    { name: 'Restaurants/Food', key: 'restaurants_food' },
    { name: 'Bars', key: 'bars' },
    { name: 'Shopping', key: 'shopping' },
    { name: 'Transport & travel', key: 'transport_travel' },
    { name: 'Group this yourself', key: 'group_yourself' },
    { name: 'Gift', key: 'gift' }
]);

const { formatToYYYYMMDD } = useUtils();

export function useTransactionMetrics(tableDataRef) {
    const dateOfLatestTransaction = computed(() => {
        const transactions = tableDataRef.value;
        if (transactions.length === 0) return null;

        const oldestTransaction = transactions.reduce((oldest, current) => {
            const currentDate = new Date(current.date);
            return currentDate < new Date(oldest.date) ? current : oldest;
        });

        return oldestTransaction.date;
    });

    const dateOfFirstTransaction = computed(() => {
        const length = tableDataRef.value.length;
        return tableDataRef.value[length - 2]?.date;
    });

    const expenseCategories = ref(JSON.parse(localStorage.getItem('expenseCategories')) || defaultExpenseCategories.value);

    const totalExpenses = computed(() => tableDataRef.value.filter((item) => item.counterparty === '').reduce((sum, item) => sum + item.amount, 0));

    const totalIncome = computed(() => tableDataRef.value.filter((item) => item.counterparty !== '').reduce((sum, item) => sum + item.amount, 0));

    const netBalance = computed(() => totalIncome.value - totalExpenses.value);

    // const monthlyExpenses = computed(() => {
    //     const expensesByMonth = Array(12).fill(0);
    //     transactionsRef.value
    //         .filter((item) => item.counterparty === '')
    //         .forEach((item) => {
    //             const month = new Date(item.date).getMonth();
    //             expensesByMonth[month] += item.amount;
    //         });
    //     return expensesByMonth;
    // });

    const monthlyExpenses = computed(() => {
        const expensesByMonth = Array(12).fill(0);

        tableDataRef.value.forEach((item) => {
            const date = item.date ? formatToYYYYMMDD(item.date) : '';
            if (date && /^\d{8}$/.test(date)) {
                const year = parseInt(date.slice(0, 4), 10);
                const month = parseInt(date.slice(4, 6), 10) - 1;

                if (year === 2024) {
                    const amount = parseFloat(item['amount']);
                    if (!isNaN(amount)) {
                        expensesByMonth[month] += amount;
                    }
                }
            }
        });

        return expensesByMonth;
    });

    const monthlyIncome = computed(() => {
        const incomeByMonth = Array(12).fill(0);
        tableDataRef.value
            .filter((item) => item.counterparty !== '')
            .forEach((item) => {
                const month = new Date(item.date).getMonth();
                incomeByMonth[month] += item.amount;
            });
        return incomeByMonth;
    });

    const expensesByCategory = computed(() => {
        const categoryExpenses = {};
        tableDataRef.value
            .filter((item) => item.counterparty === '')
            .forEach((item) => {
                const key = item.category?.key || 'other';
                if (!categoryExpenses[key]) categoryExpenses[key] = 0;
                categoryExpenses[key] += item.amount;
            });
        return categoryExpenses;
    });

    const monthlyExpensesByCategory = computed(() => {
        const categoryExpenses = {};

        // Initialize each category with an array of 12 zeros (for each month)
        expenseCategories.value.forEach((category) => {
            categoryExpenses[category.key] = Array(12).fill(0);
        });

        // Loop through each item in the tableData and distribute expenses into the correct category and month
        tableDataRef.value.forEach((item) => {
            const date = item.Date ? formatToYYYYMMDD(item.Date) : '';
            if (date && /^\d{8}$/.test(date)) {
                const year = parseInt(date.slice(0, 4), 10);
                const month = parseInt(date.slice(4, 6), 10) - 1;

                if (year === 2024) {
                    // Filter only for the target year
                    const amount = parseFloat(item['Amount (EUR)']);
                    const categoryKey = item.category?.key || 'other'; // Default to 'other' if category is missing

                    if (!isNaN(amount)) {
                        try {
                            categoryExpenses[categoryKey][month] += amount;
                        } catch (error) {
                            console.log(categoryKey);
                            console.log(month);
                        }
                    }
                }
            }
        });

        return categoryExpenses;
    });

    return {
        totalExpenses,
        totalIncome,
        netBalance,
        monthlyExpenses,
        monthlyIncome,
        expensesByCategory,
        monthlyExpensesByCategory,
        dateOfFirstTransaction,
        dateOfLatestTransaction
    };
}
