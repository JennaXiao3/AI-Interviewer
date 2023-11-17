'use client';

import {
  Box,
  Button,
  TextField,
  Card,
  CardContent,
  CardActions,
} from '@mui/material';
import { useContext, useState } from 'react';
import { QuestionContext } from '../providers/QuestionProvider';
import { useRouter } from 'next/navigation';

export default function QuestionForm() {
  const [questions, setQuestions] = useContext(QuestionContext);
  const [questionList, setQuestionList] = useState(questions);
  const router = useRouter();

  const addQuestion = (e) => {
    if (e.key === 'Enter') {
      setQuestionList([
        ...questionList,
        { question: e.target.value, answer: '' },
      ]);
      e.target.value = '';
      e.preventDefault();
    }
  };

  const deleteQuestion = (e) => {
    setQuestionList(questionList.filter((q, index) => index != e.target.id));
  };

  const handleNext = (e) => {
    e.preventDefault();
    setQuestions(questionList);
    router.push('/setup-overview');
  };

  return (
    <Box component='form' sx={{ paddingTop: '20px' }} onSubmit={handleNext}>
      {questionList.map((q, index) => (
        <Card key={index} sx={{ marginBottom: '10px' }}>
          <CardContent>{q.question}</CardContent>
          <CardActions>
            <Button id={index} size='small' onClick={deleteQuestion}>
              Delete
            </Button>
          </CardActions>
        </Card>
      ))}
      <TextField
        id='outlined-basic'
        label='Add Question'
        variant='outlined'
        fullWidth
        margin='normal'
        onKeyDown={addQuestion}
      />
      <Button variant='contained' sx={{ marginTop: '1rem' }} type='submit'>
        Next
      </Button>
    </Box>
  );
}
