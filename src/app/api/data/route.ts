import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const dataDir = path.join(process.cwd(), 'data');
const toolsPath = path.join(dataDir, 'tools.json');
const customersPath = path.join(dataDir, 'customers.json');
const sitesPath = path.join(dataDir, 'sites.json');
const rentalsPath = path.join(dataDir, 'rentals.json');

const initialData = {
    tools: [],
    customers: [],
    sites: [],
    rentals: []
}

async function ensureDataFilesExist() {
    try {
        await fs.access(dataDir);
    } catch {
        await fs.mkdir(dataDir);
    }

    const files = {
        [toolsPath]: initialData.tools,
        [customersPath]: initialData.customers,
        [sitesPath]: initialData.sites,
        [rentalsPath]: initialData.rentals,
    };

    for (const [filePath, defaultData] of Object.entries(files)) {
        try {
            await fs.access(filePath);
        } catch {
            await fs.writeFile(filePath, JSON.stringify(defaultData, null, 2), 'utf-8');
        }
    }
}

async function readData(filePath: string) {
    try {
        const data = await fs.readFile(filePath, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        console.error(`Error reading ${filePath}:`, error);
        return [];
    }
}

export async function GET() {
    await ensureDataFilesExist();
    
    const tools = await readData(toolsPath);
    const customers = await readData(customersPath);
    const sites = await readData(sitesPath);
    const rentals = await readData(rentalsPath);

    return NextResponse.json({ tools, customers, sites, rentals });
}

export async function POST(request: Request) {
    await ensureDataFilesExist();

    try {
        const { tools, customers, sites, rentals } = await request.json();

        await fs.writeFile(toolsPath, JSON.stringify(tools, null, 2), 'utf-8');
        await fs.writeFile(customersPath, JSON.stringify(customers, null, 2), 'utf-8');
        await fs.writeFile(sitesPath, JSON.stringify(sites, null, 2), 'utf-8');
        await fs.writeFile(rentalsPath, JSON.stringify(rentals, null, 2), 'utf-8');

        return NextResponse.json({ message: 'Data saved successfully' });
    } catch (error) {
        console.error('Error saving data:', error);
        return NextResponse.json({ message: 'Failed to save data' }, { status: 500 });
    }
}
