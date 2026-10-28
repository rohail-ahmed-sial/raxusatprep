/* USAT pattern and site settings. Edit this file when the official pattern changes. */
window.RAX=window.RAX||{};
RAX.config={
 "patternLastChecked": "2026-10-28",
 "patternNote": "Pattern taken from the RAXUSATPrep build brief. Always confirm the latest pattern, dates and eligibility on official HEC/ETC sources.",
 "negativeMarking": {
  "enabled": false,
  "perWrong": 0.25
 },
 "partI": {
  "name": "Part I — MCQs",
  "totalQuestions": 75,
  "minutes": 100,
  "sections": [
   {
    "id": "verbal",
    "name": "Verbal Reasoning",
    "short": "VR",
    "count": 20,
    "minutes": 27,
    "topics": [
     {
      "topic": "Analogy",
      "count": 5
     },
     {
      "topic": "Synonyms / Antonyms",
      "count": 4
     },
     {
      "topic": "Sentence Completion",
      "count": 6
     },
     {
      "topic": "Comprehension",
      "count": 5
     }
    ]
   },
   {
    "id": "quantitative",
    "name": "Quantitative Reasoning",
    "short": "QR",
    "count": 25,
    "minutes": 33,
    "topics": [
     {
      "topic": "Arithmetic",
      "count": 6
     },
     {
      "topic": "Algebra and Functions",
      "count": 4
     },
     {
      "topic": "Geometry",
      "count": 3
     },
     {
      "topic": "Equations",
      "count": 3
     },
     {
      "topic": "Statistics",
      "count": 3
     },
     {
      "topic": "Scenario-based / Mental Maths",
      "count": 6
     }
    ]
   },
   {
    "id": "subject",
    "name": "Subject Knowledge",
    "short": "SK",
    "count": 30,
    "minutes": 40,
    "topics": []
   }
  ]
 },
 "partII": {
  "name": "Part II — Essays",
  "minutes": 40,
  "languages": [
   "English",
   "Urdu"
  ],
  "essays": [
   {
    "type": "argument",
    "name": "Argument-based essay",
    "choose": "1 of 3",
    "marks": 15,
    "suggestedMinutes": 24,
    "words": "300–400"
   },
   {
    "type": "narrative",
    "name": "Narrative essay",
    "choose": "1 of 3",
    "marks": 10,
    "suggestedMinutes": 16,
    "words": "200–280"
   }
  ]
 },
 "categories": [
  {
   "id": "USAT-M",
   "name": "USAT-M",
   "label": "Pre-Medical",
   "icon": "heart-pulse",
   "color": "#e2557a",
   "background": "FSc Pre-Medical",
   "blurb": "For students from a Pre-Medical background heading to medical, health and life-science programmes.",
   "subjects": [
    {
     "subject": "Physics",
     "count": 8
    },
    {
     "subject": "Chemistry",
     "count": 8
    },
    {
     "subject": "Biology",
     "count": 14
    }
   ]
  },
  {
   "id": "USAT-E",
   "name": "USAT-E",
   "label": "Pre-Engineering",
   "icon": "cog",
   "color": "#f08a24",
   "background": "FSc Pre-Engineering",
   "blurb": "For students from a Pre-Engineering background heading to engineering and physical-science programmes.",
   "subjects": [
    {
     "subject": "Physics",
     "count": 10
    },
    {
     "subject": "Chemistry",
     "count": 10
    },
    {
     "subject": "Mathematics",
     "count": 10
    }
   ]
  },
  {
   "id": "USAT-CS",
   "name": "USAT-CS",
   "label": "Computer Science",
   "icon": "chip",
   "color": "#2aa6a0",
   "background": "ICS",
   "blurb": "For students from an ICS background heading to computing and IT programmes.",
   "subjects": [
    {
     "subject": "Physics",
     "count": 8
    },
    {
     "subject": "Computer Science",
     "count": 14
    },
    {
     "subject": "Mathematics",
     "count": 8
    }
   ]
  },
  {
   "id": "USAT-GS",
   "name": "USAT-GS",
   "label": "General Science",
   "icon": "atom",
   "color": "#5b7cfa",
   "background": "General Science",
   "blurb": "For students from a General Science background (Maths, Statistics, Economics).",
   "subjects": [
    {
     "subject": "Mathematics",
     "count": 10
    },
    {
     "subject": "Statistics",
     "count": 10
    },
    {
     "subject": "Economics",
     "count": 10
    }
   ]
  },
  {
   "id": "USAT-A",
   "name": "USAT-A",
   "label": "Arts & Humanities",
   "icon": "book",
   "color": "#9b5de5",
   "background": "FA / Humanities",
   "blurb": "For students from an Arts or Humanities background heading to social-science and humanities programmes.",
   "subjects": [
    {
     "subject": "Islamiat / Ethics",
     "count": 10
    },
    {
     "subject": "Pakistan Studies",
     "count": 10
    },
    {
     "subject": "General Knowledge",
     "count": 10
    }
   ]
  },
  {
   "id": "USAT-COM",
   "name": "USAT-COM",
   "label": "Commerce",
   "icon": "chart",
   "color": "#22a06b",
   "background": "I.Com",
   "blurb": "For students from a Commerce background heading to business, accounting and commerce programmes.",
   "subjects": [
    {
     "subject": "Accounting",
     "count": 10
    },
    {
     "subject": "Commerce",
     "count": 10
    },
    {
     "subject": "Economics",
     "count": 10
    }
   ]
  }
 ],
 "subjectFiles": {
  "Verbal Reasoning": "verbal",
  "Quantitative Reasoning": "quantitative",
  "Physics": "physics",
  "Chemistry": "chemistry",
  "Biology": "biology"
 },
 "leitnerDays": [
  0,
  1,
  3,
  7,
  14
 ],
 "contact": {
  "email": "rohilahmedsial@gmail.com",
  "github": "https://github.com/rohail-ahmed-sial",
  "githubHandle": "rohail-ahmed-sial",
  "linkedin": "https://www.linkedin.com/in/rohailahmedsial",
  "linkedinHandle": "rohailahmedsial"
 },
 "official": [
  {
   "name": "Higher Education Commission (HEC)",
   "url": "https://www.hec.gov.pk"
  },
  {
   "name": "Education Testing Council (ETC), HEC",
   "url": "https://etc.hec.gov.pk"
  }
 ]
};
