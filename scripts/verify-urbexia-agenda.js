const { createClient } = require('@supabase/supabase-js');
const url = 'https://gknglowozpewwrtjumuc.supabase.co';
const key = 'sb_publishable_0bdK2TAGnlyUKCnloX1Dug_Sg5uedKc';
const sb = createClient(url, key);

async function verify() {
  const { data: event, error: errEvent } = await sb.from('events').select('id, name, tagline, description, location, venue_name, start_date, end_date').eq('id', 'f16b8b30-9e45-4bf8-a31d-5f39f60a7a3e').single();
  console.log('EVENT VERIFICATION:');
  console.log(JSON.stringify(event, null, 2));

  const { data: sessions, error: errSessions } = await sb.from('sessions')
    .select('id, title, track, date, start_time, end_time, speakers, location, description')
    .eq('event_id', 'f16b8b30-9e45-4bf8-a31d-5f39f60a7a3e')
    .order('start_time', { ascending: true });

  console.log('\nSESSIONS COUNT:', sessions ? sessions.length : 0);
  (sessions || []).forEach((s, idx) => {
    const spk = s.speakers && s.speakers[0] ? s.speakers[0] : {};
    console.log(`[#${idx+1}] ${s.start_time.substring(11,16)} - ${s.end_time.substring(11,16)} | ${s.title}`);
    console.log(`     Track: ${s.track}`);
    console.log(`     Speaker: ${spk.name} (${spk.title} | ${spk.company})`);
    console.log(`     Topic: ${spk.topic}`);
  });
}
verify();
