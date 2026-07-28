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
npm install mammoth
npm install react-markdown remark-gfm
```
Used for document viewing purposes

## For Running the Dev Web App
You will need two open terminals. In the first, make sure you are in the eduvideo directory. Then run the command:
```bash
npm run dev
```
Once that runs it will tell you the local link where the dev site is hosted. It should be localhost:3000 but sometimes it might be different. Open that link to view the web app. 

For the second terminal start the virtual environment then, go to the video-engine directory. If you have not already, while in that directory run these commands to install the dependencies needed to connect with the front end:
```bash
pip install "fastapi[standard]"
pip install firebase-admin
```
Once you have those installed, set up the backend environment by running either of these commands:
```bash
fastapi dev server.py
or
python server.py
```
This will set up the backend environment and actually allow for video generation within the web app. In order for this to work you will need the firebase access keys, access to the virtual GPU, and the keys to the openAi agents. 

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
