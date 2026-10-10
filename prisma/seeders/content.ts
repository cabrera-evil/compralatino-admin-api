import { ContentKey, ContentSection } from '@/constants/content';
import { Prisma, PrismaClient } from 'prisma/generated/client';

type Seed = [key: string, data: Prisma.InputJsonObject];

// Copy comes verbatim from the former frontend fixtures; position = array order.
const SECTIONS: Record<string, Seed[]> = {
	[ContentSection.HOME_STATS]: [
		['commission', { value: '10%', label: 'Tarifa de gestión sobre el lote' }],
		['rate', { value: '$1 = ¥154.34', label: 'Tipo de cambio de referencia' }],
		['freight', { value: '$8.50/lb', label: 'Envío consolidado aéreo' }],
		['tracking', { value: 'Rastreo', label: 'Seguimiento hasta San Salvador' }],
	],
	[ContentSection.HOME_HOW_IT_WORKS]: [
		[
			'search',
			{
				title: 'Busca',
				description:
					'Explora lotes de Yahoo Auctions Japón con precios en USD y su referencia en JPY.',
				icon: 'search',
			},
		],
		[
			'bid',
			{
				title: 'Puja',
				description:
					'Elige Pujar o Comprar ya y nosotros gestionamos la oferta en japonés por ti.',
				icon: 'gavel',
			},
		],
		[
			'consolidate',
			{
				title: 'Consolidamos en Japón',
				description:
					'Verificamos, embalamos y agrupamos tus lotes en un solo envío consolidado.',
				icon: 'warehouse',
			},
		],
		[
			'receive',
			{
				title: 'Recibe en San Salvador',
				description:
					'Sigue el Rastreo de tu pedido y retíralo con aduana estimada desde el inicio.',
				icon: 'package-check',
			},
		],
	],
	[ContentSection.HOME_COST_LINES]: [
		['lot', { label: 'Valor de lote subastado', amount: '92.00' }],
		[
			'commission',
			{ label: 'Tarifa de gestión CompraLatino (10%)', amount: '9.20' },
		],
		[
			'customs',
			{ label: 'Estimación Aduana El Salvador (DAI + IVA)', amount: '14.50' },
		],
	],
	[ContentSection.HOME_COST_SUMMARY]: [
		[
			ContentKey.COST_TOTAL,
			{ label: 'Total estimado a pagar', amount: '115.70' },
		],
		[
			ContentKey.COST_FOOTNOTE,
			{
				text: 'El flete aéreo Japón-San Salvador ($8.50/lb) se liquida tras el pesaje oficial en bodega de Tokio.',
			},
		],
	],
	[ContentSection.HOME_FAQ]: [
		[
			'what-is',
			{
				question: '¿Qué es CompraLatino?',
				answer:
					'Es un servicio de compra por encargo: pujamos o compramos por ti en Yahoo Auctions Japón y entregamos tu pedido en El Salvador.',
			},
		],
		[
			'fees',
			{
				question: '¿Cuánto cobran por el servicio?',
				answer:
					'La Tarifa de gestión es del 10% sobre el valor del lote. Cubre la verificación en Japón, el embalaje y la mediación con el vendedor.',
			},
		],
		[
			'shipping',
			{
				question: '¿Cómo funciona el envío consolidado?',
				answer:
					'Agrupamos tus lotes en Tokio y los enviamos juntos. El flete aéreo se liquida tras el pesaje oficial en bodega.',
			},
		],
		[
			'currency',
			{
				question: '¿En qué moneda veo los precios?',
				answer:
					'Los precios se muestran en USD y con una referencia en JPY según el tipo de cambio vigente.',
			},
		],
		[
			'tracking',
			{
				question: '¿Puedo dar seguimiento a mi pedido?',
				answer:
					'Sí. Con el Rastreo ves cada etapa, desde la subasta hasta que está listo para retiro en San Salvador.',
			},
		],
	],
	[ContentSection.AUTH_BRAND]: [
		[
			ContentKey.BRAND_HEADLINE,
			{
				badge: 'Servicio Proxy Certificado para El Salvador',
				title: 'Tu puente directo con',
				titleAccent: 'Yahoo Auctions Japón',
				description:
					'Participa en subastas niponas en tiempo real, con cotización instantánea en USD, gestión aduanal DGA garantizada y entrega puerta a puerta en todo el territorio salvadoreño.',
			},
		],
	],
	[ContentSection.AUTH_BENEFITS]: [
		[
			'escrow',
			{
				icon: 'lock-keyhole',
				title: 'Sistema Escrow y Retención',
				description:
					'Tus fondos se custodian de forma segura en USD. El pago al vendedor en Japón solo se libera cuando el lote llega verificado a nuestro centro logístico en Tokio.',
				highlight: '100% Cobertura ante fraude o extravío',
				highlightIcon: 'shield-check',
			},
		],
		[
			'dga',
			{
				icon: 'receipt-text',
				title: 'Aranceles Transparentes DGA',
				description:
					'Cálculo previo y exacto de DAI e IVA según el arancel de la Dirección General de Aduanas de El Salvador. Sin cargos sorpresivos al retirar.',
				highlight: 'Documento Único Aduanero (DUA) incluido',
				highlightIcon: 'circle-check',
			},
		],
		[
			'payments',
			{
				icon: 'banknote',
				title: 'Pagos en USD y Chivo Wallet',
				description:
					'Paga tus pujas con transferencias UNI 365, tarjetas locales Visa/Mastercard, o depósitos instantáneos en USD vía red Chivo Wallet / Lightning Network sin comisiones adicionales.',
				highlight: 'Acreditación de saldo inmediata',
				highlightIcon: 'zap',
			},
		],
		[
			'consolidation',
			{
				icon: 'plane',
				title: 'Consolidación en Tokio',
				description:
					'Agrupa hasta 10 artículos en un solo flete internacional Japón → El Salvador. Ahorra hasta un 45% en envíos aéreos express hacia San Salvador, Santa Ana o San Miguel.',
				highlight: 'Rastreo paso a paso 24/7',
				highlightIcon: 'truck',
			},
		],
	],
	[ContentSection.AUTH_METRICS]: [
		['won', { value: '+18,400', label: 'Subastas ganadas en Japón' }],
		[
			'delivery',
			{ value: '14 Días', label: 'Tiempo promedio de entrega en SV' },
		],
		[
			'fees',
			{ value: '$0 Costo Oculto', label: 'Transparencia arancelaria total' },
		],
	],
};

export const seedContent = async (prisma: PrismaClient) => {
	for (const [section, seeds] of Object.entries(SECTIONS)) {
		for (const [position, [key, data]] of seeds.entries()) {
			await prisma.contentEntry.upsert({
				where: { section_key: { section, key } },
				create: { section, key, position, data },
				update: {},
			});
		}
	}
	console.log('[seed] content entries upserted');
};
