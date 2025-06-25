declare namespace JSX {
interface IntrinsicElements {
'elevenlabs-convai': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
'agent-id'?: string;
'text-preamble'?: string;
'show-intro-message'?: string;
[key: string]: any;
};
}
}