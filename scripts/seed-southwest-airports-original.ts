import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const airports = [
  {
    code: 'ALB',
    name: 'Albany',
    carrier: 'SOUTHWEST_CARGO',
    operator: 'Mobile Air Transport',
    address: '46 Kelly Rd',
    city: 'Latham',
    state: 'NY',
    zip: '12110',
    hours: {
      'Mon-Fri': '5:00am-9:00pm',
      'Sat-Sun': 'Closed',
    },
  },
  {
    code: 'ABQ',
    name: 'Albuquerque',
    carrier: 'SOUTHWEST_CARGO',
    operator: null,
    address: '2200 Sunport Blvd (Bay F)',
    city: 'Albuquerque',
    state: 'NM',
    zip: '87106',
    hours: {
      'Mon-Fri': '5:00am-12:00am',
      'Sat-Sun': '5:30am-9:00pm',
    },
  },
  {
    code: 'AMA',
    name: 'Amarillo',
    carrier: 'SOUTHWEST_CARGO',
    operator: null,
    address: '10801 Airport Blvd',
    city: 'Amarillo',
    state: 'TX',
    zip: '79111',
    hours: {
      'Mon-Fri': '6:00am-10:45pm',
      Sat: '7:00am-3:30pm',
      Sun: '9:00am-8:00pm',
    },
  },
  {
    code: 'ATL',
    name: 'Atlanta',
    carrier: 'SOUTHWEST_CARGO',
    operator: null,
    address: '3400 Interloop Rd Space G2-Cargo',
    city: 'Atlanta',
    state: 'GA',
    zip: '30354',
    hours: {
      'Mon-Fri': '5:00am-12:00am',
      'Sat-Sun': '5:00am-11:00pm',
    },
  },
  {
    code: 'AUS',
    name: 'Austin',
    carrier: 'SOUTHWEST_CARGO',
    operator: null,
    address: '3400 Spirit of Texas Dr Ste 250',
    city: 'Austin',
    state: 'TX',
    zip: '78719',
    hours: {
      'Mon-Fri': '4:30am-1:30am',
      Sat: '5:30am-9:00pm',
      Sun: '4:30am-9:00pm',
    },
  },
  {
    code: 'BWI',
    name: 'Baltimore/Washington',
    carrier: 'SOUTHWEST_CARGO',
    operator: null,
    address: 'BWI Building C Air Cargo Drive',
    city: 'Linthicum',
    state: 'MD',
    zip: '21240',
    hours: {
      Mon: '5:00am-12:00am',
      'Tue-Fri': 'Open 24 hours',
      Sat: '12:00am-8:00pm',
      Sun: '5:00am-8:00pm',
    },
  },
  {
    code: 'BHM',
    name: 'Birmingham',
    carrier: 'SOUTHWEST_CARGO',
    operator: null,
    address: '1710 40th St N Ste C',
    city: 'Birmingham',
    state: 'AL',
    zip: '35217',
    hours: {
      'Mon-Fri': '4:45am-9:45pm',
      Sat: '5:00am-8:00pm',
      Sun: '5:00am-7:30pm',
    },
  },
  {
    code: 'BOS',
    name: 'Boston',
    carrier: 'SOUTHWEST_CARGO',
    operator: null,
    address: '112 Harborside Dr South Cargo Bldg 63',
    city: 'Boston',
    state: 'MA',
    zip: '02128',
    hours: {
      'Mon-Fri': '4:30am-12:00am',
      Sat: '5:00am-7:00pm',
      Sun: '5:00am-5:00pm',
    },
  },
  {
    code: 'BUF',
    name: 'Buffalo',
    carrier: 'SOUTHWEST_CARGO',
    operator: null,
    address: '281 Cayuga Rd',
    city: 'Buffalo',
    state: 'NY',
    zip: '14225',
    hours: {
      'Mon-Fri': '6:00am-11:00pm',
      'Sat-Sun': '6:00am-1:30pm',
    },
  },
  {
    code: 'BUR',
    name: 'Burbank',
    carrier: 'SOUTHWEST_CARGO',
    operator: null,
    address: '4209 Empire Ave',
    city: 'Burbank',
    state: 'CA',
    zip: '91505',
    hours: {
      'Mon-Fri': '5:30am-10:30pm',
      'Sat-Sun': '6:30am-6:30pm',
    },
  },
  // Continue with remaining airports...
  {
    code: 'DAL',
    name: 'Dallas Love Field',
    carrier: 'SOUTHWEST_CARGO',
    operator: null,
    address: '7510 Aviation Place Ste 110',
    city: 'Dallas',
    state: 'TX',
    zip: '75235',
    hours: {
      'Mon-Fri': '4:30am-1:30am',
      Sat: '4:30am-12:00am',
      Sun: '4:30am-1:30am',
    },
  },
  {
    code: 'DEN',
    name: 'Denver',
    carrier: 'SOUTHWEST_CARGO',
    operator: null,
    address: '7640 N Undergrove St (Suite E)',
    city: 'Denver',
    state: 'CO',
    zip: '80249',
    hours: {
      'Mon-Sat': '4:30am-12:00am',
      Sun: '5:00am-12:00am',
    },
  },
  {
    code: 'HOU',
    name: 'Houston Hobby',
    carrier: 'SOUTHWEST_CARGO',
    operator: null,
    address: '7910 Airport Blvd',
    city: 'Houston',
    state: 'TX',
    zip: '77061',
    hours: {
      Mon: '4:00am-12:00am',
      'Tue-Fri': 'Open 24 hours',
      Sat: '12:00am-12:00am',
      Sun: '5:00am-12:00am',
    },
  },
  {
    code: 'LAS',
    name: 'Las Vegas',
    carrier: 'SOUTHWEST_CARGO',
    operator: null,
    address: '6055 Surrey St Ste 121',
    city: 'Las Vegas',
    state: 'NV',
    zip: '89119',
    hours: {
      'Mon-Fri': '4:30am-11:30pm',
      'Sat-Sun': '6:00am-9:30pm',
    },
  },
  {
    code: 'LAX',
    name: 'Los Angeles',
    carrier: 'SOUTHWEST_CARGO',
    operator: null,
    address: '5600 W Century Blvd',
    city: 'Los Angeles',
    state: 'CA',
    zip: '90045',
    hours: {
      Mon: '4:30am-12:00am',
      'Tue-Fri': 'Open 24 hours',
      Sat: '12:00am-12:00am',
      Sun: '5:00am-12:00am',
    },
  },
  {
    code: 'PHX',
    name: 'Phoenix',
    carrier: 'SOUTHWEST_CARGO',
    operator: null,
    address: '1251 S 25th PIace Ste 16',
    city: 'Phoenix',
    state: 'AZ',
    zip: '85034',
    hours: {
      'Mon-Fri': '4:15am-1:30am',
      Sat: '5:00am-12:45am',
      Sun: '5:00am-1:30am',
    },
  },
  {
    code: 'SAN',
    name: 'San Diego',
    carrier: 'SOUTHWEST_CARGO',
    operator: null,
    address: '2361 Airlane Rd',
    city: 'San Diego',
    state: 'CA',
    zip: '92101',
    hours: {
      'Mon-Fri': '5:30am-11:30pm',
      Sat: '5:30am-10:30pm',
      Sun: '9:00am-5:00pm',
    },
  },
  {
    code: 'SEA',
    name: 'Seattle/Tacoma',
    carrier: 'SOUTHWEST_CARGO',
    operator: null,
    address: '16215 Air Cargo Rd',
    city: 'Seattle',
    state: 'WA',
    zip: '98158',
    hours: {
      'Mon-Fri': '5:00am-12:00am',
      'Sat-Sun': '6:00am-10:00pm',
    },
  },
]

async function main() {
  console.log('🛫 Seeding Southwest Cargo airport locations...')

  for (const airport of airports) {
    try {
      await prisma.airport.upsert({
        where: { code: airport.code },
        update: {
          ...airport,
          updatedAt: new Date(),
        },
        create: {
          id: `airport_${airport.code.toLowerCase()}`,
          ...airport,
          isActive: true,
          updatedAt: new Date(),
        },
      })
      console.log(`✅ ${airport.name} (${airport.code})`)
    } catch (error) {
      console.error(`❌ Failed to seed ${airport.name}:`, error)
    }
  }

  console.log('\n✨ Southwest Cargo airports seeded successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
