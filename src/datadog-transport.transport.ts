import Transport from 'winston-transport';
import logForm from 'logform';
import axios from 'axios';

export type TransportOptions = {
	apiKey: string;
	hostname?: string;
	service?: string;
	ddsource?: string;
	ddtags?: string;
	intakeRegion?: string;
	format?: logForm.Format;
	level?: string;
	silent?: boolean;
	handleExceptions?: boolean;

	log?(info: any, next: () => void): any;
	logv?(info: any, next: () => void): any;
	close?(): void;
};

export default class DatadogTransport extends Transport {
	private readonly api;
	constructor(private readonly opts: TransportOptions) {
		super(opts);

		if (!opts.apiKey) {
			throw new Error('Missing required option: `apiKey`');
		}
		this.opts = opts;
		if (this.opts.intakeRegion === 'eu') {
			this.api = `https://http-intake.logs.datadoghq.eu/v1/input/${opts.apiKey}`;
		} else if (this.opts.intakeRegion === 'us3') {
			this.api = `https://http-intake.logs.us3.datadoghq.com/v1/input/${opts.apiKey}`;
		} else if (this.opts.intakeRegion === 'us5') {
			this.api = `https://http-intake.logs.us5.datadoghq.com/v1/input/${opts.apiKey}`;
		} else {
			this.api = `https://http-intake.logs.datadoghq.com/v1/input/${opts.apiKey}`;
		}
	}

	get name() {
		return 'datadog';
	}

	async log(info, callback) {
		// check for debug, verbose logs are allowed
		const debugLoggingOff = info?.level === 'debug' && process.env.DEBUG_SWITCH === 'off';
		const verboseLoggingOff = info?.level === 'verbose' && process.env.VERBOSE_SWITCH === 'off';

		const detailedLoggingOff = debugLoggingOff || verboseLoggingOff;

		if (detailedLoggingOff) return;

		setImmediate(() => {
			this.emit('logged', info);
		});

		// create query params
		const query: Record<string, string> = ['service', 'ddsource', 'ddtags', 'hostname'].reduce((a, b) => {
			if (this.opts.hasOwnProperty(b)) {
				a[b] = this.opts[b];
			}
			return a;
		}, {});

		const append = (string) => {
			if (query.ddtags) {
				query.ddtags += `,${string}`;
			} else {
				query.ddtags = string;
			}
		};
		// append resourceName to query params

		if (info?.resourceName) {
			append(`resourceName:${info.resourceName}`);
			delete info.resourceName;
		} else if (info?.level !== 'verbose') {
			throw new Error('Missing required key `resourceName` in log statement');
		}

		// append metadata to query params
		if (info?.meta) {
			Object.entries(info.meta).map(([key, value]) => {
				append(`${key}:${value}`);
			});
			delete info.meta;
		}

		const { ddtags, ...logs } = info;

		// append ddtage and traces to query params
		info.dd && append(`trace_id:${info.dd.trace_id},span_id:${info.dd.span_id}`);
		ddtags && append(ddtags);

		// encode query params and attach it to api url
		const queryString = new URLSearchParams(query).toString();
		const api = queryString ? `${this.api}?${queryString}` : this.api;

		try {
			// Perform the writing to the  service
			await axios({
				url: api,
				method: 'POST',
				headers: {
					'content-type': 'application/json',
				},
				data: JSON.stringify(logs),
			});
		} catch (err) {
		} finally {
			callback();
		}
	}
}

