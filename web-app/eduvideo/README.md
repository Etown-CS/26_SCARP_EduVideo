This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm install

npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Setting Up Firebase

```bash
npm install firebase
```

Initialize the Firebase SDK using the information from your project to create a config file. The information needed is located within your project: Go to settings -> general, then scroll down to the bottom to find the SDK configuration info. The config file for this project is located within the firebase folder. The necessary variables are stored in .env.local

## Setting Up OpenAI Key

```bash
npm install openai
```
The openai API key is stored in .env. Everything for the agent configuration is located in the agent folder within the api folder. 

## Setting Up Document Viewing 

```bash
npm install react-pdf
```
Used for document viewing purposes

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
