import type { ApiEndpoint } from '$lib/types/api';
import type { CodeSnippet } from '$lib/types/api';

export function generateSnippets(endpoint: ApiEndpoint, baseUrl: string): CodeSnippet[] {
	return [
		{
			language: 'shellscript',
			title: 'curl',
			code: generateCurl(endpoint, baseUrl)
		},
		{
			language: 'python',
			title: 'requests',
			code: generatePython(endpoint, baseUrl)
		},
		{
			language: 'javascript',
			title: 'fetch',
			code: generateJavaScript(endpoint, baseUrl)
		},
		{
			language: 'csharp',
			title: 'HttpClient',
			code: generateCSharp(endpoint, baseUrl)
		}
	];
}

// Profilarr rejects requests that change data without a Content-Type header,
// even when they have no body.
function sendsContentType(endpoint: ApiEndpoint): boolean {
	return endpoint.method !== 'GET';
}

function generateCurl(endpoint: ApiEndpoint, baseUrl: string): string {
	const lines: string[] = [];
	const url = `\${PROFILARR_URL}${baseUrl}${endpoint.path}`;

	lines.push(`curl -X ${endpoint.method} "${url}" \\`);
	lines.push(`  -H "X-Api-Key: \${API_KEY}"`);

	if (sendsContentType(endpoint)) {
		lines[lines.length - 1] += ' \\';
		lines.push(`  -H "Content-Type: application/json"`);
	}

	if (endpoint.requestBody) {
		lines[lines.length - 1] += ' \\';
		lines.push(`  -d '${endpoint.requestBody.example}'`);
	}

	return lines.join('\n');
}

function generatePython(endpoint: ApiEndpoint, baseUrl: string): string {
	const lines: string[] = [];
	const url = `{profilarr_url}${baseUrl}${endpoint.path}`;
	const method = endpoint.method.toLowerCase();

	lines.push('import requests');
	lines.push('');
	lines.push('profilarr_url = "http://localhost:6868"');
	lines.push('');
	lines.push(`response = requests.${method}(`);
	lines.push(`    "${url}",`);
	// requests sets Content-Type itself when it sends a JSON body
	if (sendsContentType(endpoint) && !endpoint.requestBody) {
		lines.push('    headers={"X-Api-Key": API_KEY, "Content-Type": "application/json"},');
	} else {
		lines.push('    headers={"X-Api-Key": API_KEY},');
	}

	if (endpoint.requestBody) {
		lines.push(`    json=${pythonDict(endpoint.requestBody.example)},`);
	}

	lines.push(')');
	lines.push('');
	lines.push('print(response.json())');

	return lines.join('\n');
}

function generateJavaScript(endpoint: ApiEndpoint, baseUrl: string): string {
	const lines: string[] = [];
	const url = `\${profilarrUrl}${baseUrl}${endpoint.path}`;

	lines.push('const profilarrUrl = "http://localhost:6868";');
	lines.push('');
	lines.push(`const response = await fetch(\`${url}\`, {`);

	if (endpoint.method !== 'GET') {
		lines.push(`  method: "${endpoint.method}",`);
	}

	lines.push('  headers: {');
	lines.push('    "X-Api-Key": API_KEY,');

	if (sendsContentType(endpoint)) {
		lines.push('    "Content-Type": "application/json",');
	}

	lines.push('  },');

	if (endpoint.requestBody) {
		lines.push(`  body: JSON.stringify(${endpoint.requestBody.example}),`);
	}

	lines.push('});');
	lines.push('');
	lines.push('const data = await response.json();');
	lines.push('console.log(data);');

	return lines.join('\n');
}

function generateCSharp(endpoint: ApiEndpoint, baseUrl: string): string {
	const lines: string[] = [];
	const url = `{profilarrUrl}${baseUrl}${endpoint.path}`;

	lines.push('using var client = new HttpClient();');
	lines.push('');
	lines.push('var profilarrUrl = "http://localhost:6868";');
	lines.push('client.DefaultRequestHeaders.Add("X-Api-Key", apiKey);');
	lines.push('');

	if (endpoint.requestBody) {
		lines.push(`var content = new StringContent(`);
		lines.push(`    ${csharpString(endpoint.requestBody.example)},`);
		lines.push('    System.Text.Encoding.UTF8,');
		lines.push('    "application/json"');
		lines.push(');');
		lines.push('');
		lines.push(`var response = await client.${csharpMethod(endpoint.method)}Async(`);
		lines.push(`    $"${url}",`);
		lines.push('    content');
		lines.push(');');
	} else if (sendsContentType(endpoint)) {
		// Content-Type belongs to the content, so a write without a body sends empty content
		lines.push(
			`var request = new HttpRequestMessage(HttpMethod.${csharpMethod(endpoint.method)}, $"${url}")`
		);
		lines.push('{');
		lines.push(
			'    Content = new StringContent("", System.Text.Encoding.UTF8, "application/json")'
		);
		lines.push('};');
		lines.push('');
		lines.push('var response = await client.SendAsync(request);');
	} else {
		lines.push(`var response = await client.${csharpMethod(endpoint.method)}Async(`);
		lines.push(`    $"${url}"`);
		lines.push(');');
	}

	lines.push('');
	lines.push('var body = await response.Content.ReadAsStringAsync();');
	lines.push('Console.WriteLine(body);');

	return lines.join('\n');
}

function csharpMethod(method: string): string {
	switch (method) {
		case 'GET':
			return 'Get';
		case 'POST':
			return 'Post';
		case 'PUT':
			return 'Put';
		case 'PATCH':
			return 'Patch';
		case 'DELETE':
			return 'Delete';
		default:
			return 'Send';
	}
}

function csharpString(json: string): string {
	return `@"${json.replace(/"/g, '""')}"`;
}

/** Convert a JSON string to a Python-ish dict representation */
function pythonDict(json: string): string {
	return json
		.replace(/"([^"]+)":/g, '"$1":')
		.replace(/: true/g, ': True')
		.replace(/: false/g, ': False')
		.replace(/: null/g, ': None');
}
