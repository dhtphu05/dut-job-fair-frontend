import { defineConfig } from 'orval';

export default defineConfig({
    'dut-job-fair': {
        input: {
            target: 'http://localhost:3000/docs-json', // URL of the backend's OpenAPI JSON spec
        },
        output: {
            target: './lib/api/generated/dut-job-fair.ts',
            schemas: './lib/api/generated/model',
            client: 'react-query',
            mode: 'tags-split',
            override: {
                mutator: {
                    path: './lib/axios-instance.ts',
                    name: 'customAxiosInstance',
                },
                query: {
                    useQuery: true,
                    useMutation: true,
                    signal: true,
                },
            },
        },
    },
});
