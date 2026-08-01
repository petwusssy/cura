const fs = require('fs');

const paths = JSON.parse(fs.readFileSync('paths_data.json', 'utf8'));

// Helper to calculate color difference
function colorDiff(hex1, hex2) {
  const r1 = parseInt(hex1.substring(1,3), 16);
  const g1 = parseInt(hex1.substring(3,5), 16);
  const b1 = parseInt(hex1.substring(5,7), 16);
  const r2 = parseInt(hex2.substring(1,3), 16);
  const g2 = parseInt(hex2.substring(3,5), 16);
  const b2 = parseInt(hex2.substring(5,7), 16);
  return Math.abs(r1-r2) + Math.abs(g1-g2) + Math.abs(b1-b2);
}

// Stethoscope tube and earpieces are dark gray / black
// e.g. #434B5B, #434A5B, #727681, #444B5B, #8E9097, #85929A, #84949F, #7E8D96, #828C95, #8D99A0, #91A1AD, #89959C, #85939B, #96A1A7, #96A0A7, #8C97A0, #8C9AA2
// Stethoscope metal is light gray/blue-gray: #C1CACF, #C1CACD, #C5CCD0, #C3CDD2, #DEE8EC, #D2DEE2, #D9E4E9, #DAE5E7, #EEF9FB, #CFE1EA, #D9E4E8, #DADBDD, #E7F8FC, #E7F5F8, #D0DEE5, #D1E5EE, #DFEBED, #DAE4E9, #D8E4EA, #D5E3E9, #BCC6CC, #BAC3C9, #D4E3EA, #D1DEE5
// Wait, the coat is also white/light blue! #F4FAFD, #F4F9FD, #B9DBED, #B8D9EA, #F1F8FA, #F0FAFD, #F0FAFB, #F1FAFB, #F2FBFD
// We must distinguish coat from stethoscope metal.
// And skin is blue: #B8DCEE, #95C2DC, #B7D1D8, #B0C6CF, #B9DBED, #B9CDD7, #C9E0EC, #C1D6E0, #BBD6E1, #96BED5, #96C0D6, #BBD2E3, #BADBE9, #9BC1D7, #97C1D9, #B7CCD7, #99BBCE, #93BBD1, #C6DFED, #CBE0EB, #8CC3EB, #8BC3E9, #9BC4DF, #80BFEE, #ADDBF8, #73B2DD, #C6DEE8, #679EC8, #BFD4DE, #9BC5DB, #98C2D7, #83BAE3, #8DC3EB, #8BC3EC, #94C1DA, #B4DBF1, #98C0D7, #9EC6DF, #71ADD8, #7DB2DA, #C4DEE8, #66A9DA, #85C4F3
// Hands are skin or gloves? Wait, the right hand is #E8F5FB, #E8F7FC, #E7F3FA, #B6C7CF, #BED3DB, #C5D7E2, #E2EEF2, #BBC4C9, #EEF8FD. These are whiteish/light blue... GLOVES! The mascot is wearing surgical gloves!
// So hands are gloves, coat is white/light blue, stethoscope is gray/metal, skin is elephant blue.

const groups = {
  head: [],
  left_ear: [],
  right_ear: [],
  trunk: [],
  eyes: [],
  mouth: [],
  body: [],
  coat: [],
  left_arm: [],
  left_hand: [],
  right_arm: [],
  right_hand: [],
  stethoscope: [],
  id_badge: []
};

// We will iterate through paths and assign them manually based on careful rules.
for (let p of paths) {
  let { tx, ty, fill, index } = p;
  
  // Eyes and mouth: Dark colors #59687C, #5F6B7E, #5A7286, #546476, #4282BD, #498AC1, #4E85B6, #4382B8, #3C7FB5, #3479B3, #5B9ED4
  if (["#59687C", "#5F6B7E", "#5A7286", "#546476", "#4282BD", "#498AC1", "#4E85B6", "#4382B8", "#3C7FB5", "#3479B3", "#5B9ED4"].includes(fill.toUpperCase())) {
    if (tx > 320 && tx < 380 && ty > 190 && ty < 260) {
      groups.mouth.push(p);
    } else {
      groups.eyes.push(p);
    }
    continue;
  }
  
  // Face blushes: #F5A290, #E3A99F, #DBAFA7, #E6AAA0, #F3A391, #D5B6B2
  if (["#F5A290", "#E3A99F", "#DBAFA7", "#E6AAA0", "#F3A391", "#D5B6B2"].includes(fill.toUpperCase())) {
    groups.head.push(p); // Blushes belong to head
    continue;
  }

  // Id badge? Let's check for specific colors: #D3C7CD, #CFD1DB, #C9D7E3, #CCD2D7
  if (["#D3C7CD", "#CFD1DB", "#C9D7E3", "#CCD2D7"].includes(fill.toUpperCase())) {
    groups.id_badge.push(p);
    continue;
  }

  // Stethoscope tubes (dark grays)
  if (["#434B5B", "#434A5B", "#727681", "#444B5B", "#8E9097", "#85929A", "#84949F", "#7E8D96", "#828C95", "#8D99A0", "#91A1AD", "#89959C", "#85939B", "#96A1A7", "#96A0A7", "#8C97A0", "#8C9AA2", "#BBCBD3"].includes(fill.toUpperCase())) {
    groups.stethoscope.push(p);
    continue;
  }
  
  // Stethoscope metal
  if (["#C1CACF", "#C1CACD", "#C5CCD0", "#C3CDD2", "#DEE8EC", "#D2DEE2", "#D9E4E9", "#DAE5E7", "#EEF9FB", "#CFE1EA", "#D9E4E8", "#DADBDD", "#E7F8FC", "#E7F5F8", "#D0DEE5", "#D1E5EE", "#DFEBED", "#DAE4E9", "#D8E4EA", "#D5E3E9", "#BCC6CC", "#BAC3C9", "#D4E3EA", "#D1DEE5", "#D6E8F1", "#B4C3CC"].includes(fill.toUpperCase())) {
    groups.stethoscope.push(p);
    continue;
  }

  // Gloves (Hands)
  // Right hand (waving) at tx: 430-490, ty: 290-340
  // Left hand resting at tx: 250-330, ty: 250-300
  // Let's rely on position and white/blue-white colors.
  if (ty > 280) {
    if (tx > 400) {
      groups.right_hand.push(p);
      continue;
    } else if (tx < 350) {
      groups.left_hand.push(p);
      continue;
    }
  }

  // Coat (large white areas)
  if (["#F4FAFD", "#F4F9FD", "#B9DBED", "#B8D9EA", "#F1F8FA", "#F0FAFD", "#F0FAFB", "#F1FAFB", "#F2FBFD"].includes(fill.toUpperCase())) {
    // If it's over tx 390 and ty 190-250, it's right arm sleeve
    if (tx > 390 && ty > 190 && ty < 280) {
      groups.right_arm.push(p);
    } else if (tx < 330 && ty > 180 && ty < 260) {
      groups.left_arm.push(p);
    } else {
      groups.coat.push(p);
    }
    continue;
  }

  // Trunk (Elephant trunk)
  // Usually around center x=300-380, y=140-190
  // I'll group anything that is skin colored and centrally located into trunk or head.
  // Actually, I can just leave trunk in head if I can't distinguish. Let's put skin < ty 180 into head.
  if (ty < 180) {
    if (tx < 280) groups.left_ear.push(p);
    else if (tx > 400) groups.right_ear.push(p);
    else groups.head.push(p);
    continue;
  }

  // Remaining should be body (skin) or unclassified
  if (tx > 390) {
    groups.right_arm.push(p);
  } else if (tx < 330) {
    groups.left_arm.push(p);
  } else {
    groups.body.push(p);
  }
}

// Print summary
for (let key in groups) {
  console.log(`${key}: ${groups[key].length} paths`);
}

fs.writeFileSync('new_groups.json', JSON.stringify(groups, null, 2));
