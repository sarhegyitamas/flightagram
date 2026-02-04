import axios from 'axios';

export const sendZeptoMail = async ({ to, templateId, data, subscriberName }) => {
	const API_KEY = process.env.ZEPTO_API_KEY;
	const MAILAGENT_ID = process.env.ZEPTO_MAIL_AGENT_ID;

	const payload = {
		from: {
			address: 'hello@flightagram.com',
			name: 'Flightagram',
		},
		to: [{ email_address: { address: to, name: subscriberName} }],
		subject: "",
		template_key: templateId,
		merge_info: data,
	};

	const response = await axios.post('https://api.zeptomail.eu/v1.1/email/template', payload, {
		headers: {
			'X-MAILAGENT': MAILAGENT_ID,
			Authorization: `Zoho-enczapikey ${API_KEY}`,
		},
	});

	return response.data;
};
