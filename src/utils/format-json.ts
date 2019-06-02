export default function formatJson(json: any) {
  return JSON.stringify(json, null, 2);
}

export function formatJsonString(json: string) {
  return formatJson(JSON.parse(json));
}
