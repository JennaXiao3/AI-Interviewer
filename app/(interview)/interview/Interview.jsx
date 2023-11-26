'use client';

// using provided audio recorder, will replace with custom UI later
import { useEffect, useContext, useState, useRef } from 'react';
import {
  Button,
  Box,
  Typography,
  Grid,
  Chip,
  Modal,
  List,
  ListItem,
  ListItemText,
  Fade,
} from '@mui/material';
import ReplayIcon from '@mui/icons-material/Replay';
import ArrowForward from '@mui/icons-material/ChevronRightRounded';
import GraphicEqRoundedIcon from '@mui/icons-material/GraphicEqRounded';
import CallEndRoundedIcon from '@mui/icons-material/CallEndRounded';
import PersonIcon from '@mui/icons-material/Person';
import { JobContext } from '../../providers/JobProvider';
import { QuestionContext } from '../../providers/QuestionProvider';
import { UserDetailsContext } from '../../providers/UserDetailsProvider';
import { useAudioRecorder } from 'react-audio-voice-recorder';
import WebCamera from './webcam';
import { Player } from '@lottiefiles/react-lottie-player';
import TextTransition, { presets } from 'react-text-transition';

export default function Interview() {
  const [jobInfo, setJobInfo] = useContext(JobContext);
  const [questions, setQuestions] = useContext(QuestionContext);
  const [userDetails, setUserDetails] = useContext(UserDetailsContext);

  const [questionsAnswered, setQuestionsAnswered] = useState(0);
  const [redo, setRedo] = useState(false);
  const [interviewerTalking, setInterviewerTalking] = useState(false);
  const [questionDisplay, setQuestionDisplay] = useState('');
  const [interviewComplete, setInterviewComplete] = useState(false);
  const [modalOpen, setModalOpen] = useState(true);

  const interviewerPlayer = useRef(null);
  const speech = useRef(null);
  const ready = useRef(false);

  const parseAudio = async (blob) => {
    const res = await fetch('/util/speechToText', {
      method: 'POST',
      body: blob,
    });

    const result = await res.json();

    const newQuestions = questions.slice();

    newQuestions[questionsAnswered]['answer'] = result.answer;

    setQuestions(newQuestions);
    setQuestionsAnswered(questionsAnswered + 1);

    console.log(result.answer);
  };

  const askQuestion = async () => {
    const fetchBase = '/util/chatGPT?queryType=';
    let fetchURL = '';
    let requestBody = {};

    if (questionsAnswered == 0) {
      fetchURL = fetchBase.concat('firstMessage');
      requestBody = {
        jobTitle: jobInfo.title,
        question: questions[0].question,
      };
    } else if (questionsAnswered < questions.length) {
      fetchURL = fetchBase.concat('subesequentMessage');
      requestBody = {
        jobTitle: jobInfo.title,
        question: questions[questionsAnswered].question,
        prevQuestion: questions[questionsAnswered - 1].question,
        prevAnswer: questions[questionsAnswered - 1].answer,
      };
    } else {
      fetchURL = fetchBase.concat('lastMessage');
      requestBody = {
        jobTitle: jobInfo.title,
        prevQuestion: questions[questionsAnswered - 1].question,
        prevAnswer: questions[questionsAnswered - 1].answer,
      };
    }

    const res = await fetch(fetchURL, {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });

    const result = await res.json().then((res) => {
      textToSpeech(res.res);
    });
  };

  const textToSpeech = async (input) => {
    const res = await fetch('util/textToSpeech', {
      method: 'POST',
      body: JSON.stringify({
        text: input,
      }),
    });

    const result = await res.arrayBuffer();

    const blob = new Blob([result], { type: 'audio/mpeg' });
    const url = URL.createObjectURL(blob);

    const audio = new Audio(url);

    audio.addEventListener('ended', function () {
      setInterviewerTalking(false);
      interviewerPlayer.current.setSeeker(239, false);
      if (questionsAnswered < questions.length) {
        startRecording();
        setQuestionDisplay(questions[questionsAnswered].question);
      } else {
        setInterviewComplete(true);
      }
    });

    if (ready.current) {
      audio.play();
      interviewerPlayer.current.play();
      setInterviewerTalking(true);
    } else {
      speech.current = audio;
    }
  };

  const {
    startRecording,
    stopRecording,
    togglePauseResume,
    recordingBlob,
    isRecording,
    isPaused,
    recordingTime,
    mediaRecorder,
  } = useAudioRecorder({
    noiseSuppression: true,
    echoCancellation: true,
  });

  const redoQuestion = () => {
    setRedo(true);
    stopRecording();
  };

  useEffect(() => {
    setQuestionDisplay(
      'Welcome to your interview, ' + userDetails.name.replace(/ .*/, '')
    );
  }, []);

  useEffect(() => {
    if (!recordingBlob) {
      return;
    }

    if (redo) {
      setRedo(false);
      startRecording();
      return;
    }

    parseAudio(recordingBlob);
  }, [recordingBlob]);

  useEffect(() => {
    askQuestion();
  }, [questionsAnswered]);

  function delay(time) {
    return new Promise((resolve) => setTimeout(resolve, time));
  }

  const closeModal = () => {
    setModalOpen(false);
    ready.current = true;

    if (speech.current != null) {
      delay(1000).then(() => {
        speech.current.play();
        interviewerPlayer.current.play();
        setInterviewerTalking(true);
      });
    }
  };

  return (
    <>
      <Modal open={modalOpen} closeAfterTransition>
        <Fade in={modalOpen}>
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              bgcolor: 'background.paper',
              width: '40rem',
              padding: '3rem',
              borderRadius: '1rem',
              outline: 0,
              boxShadow: '0px 4px 6.599999904632568px 0px #00000040',
            }}
          >
            <Typography variant='h2' sx={{ marginBottom: '1rem' }}>
              Welcome to your interview!
            </Typography>
            <Box
              height={5}
              mb={4}
              mt={2}
              width='6rem'
              bgcolor='primary.main'
              borderRadius={1}
            ></Box>
            <Typography>
              Once the interview starts, the interviewer will begin by welcoming
              you and asking you the first question. Here are some tips for the
              best interview experience:
            </Typography>
            <List sx={{ listStyle: 'decimal', pl: 4 }}>
              <ListItem sx={{ display: 'list-item' }}>
                <ListItemText primary='Ensure you are in an environment with minimal background noise' />
              </ListItem>
              <ListItem sx={{ display: 'list-item' }}>
                <ListItemText primary='Talk clearly at a regular pace in the direction of your microphone' />
              </ListItem>
              <ListItem sx={{ display: 'list-item' }}>
                <ListItemText primary='Answer the questions appropriately and stay on topic' />
              </ListItem>
            </List>
            <Typography>
              Best of luck! We'll see you afterwards with your feedback.
            </Typography>
            <Box
              sx={{
                display: 'flex',
                width: '100%',
                justifyContent: 'flex-end',
                marginTop: '2rem',
              }}
            >
              <Button
                variant='outlined'
                sx={{ boxShadow: 'none', padding: '.5rem 1.5rem' }}
                endIcon={<ArrowForward />}
                onClick={closeModal}
              >
                Let's Go!
              </Button>
            </Box>
          </Box>
        </Fade>
      </Modal>
      <Box sx={{ display: 'flex', width: '100%' }}>
        <Box
          sx={{
            maxWidth: '80%',
            maxHeight: '80.98px',
            display: 'flex',
            flexDirection: 'column-reverse',
          }}
        >
          <Box
            height={5}
            mb={4}
            mt={2}
            width='6rem'
            bgcolor='primary.main'
            borderRadius={1}
          >
            &#8203;
          </Box>
          <Typography variant='h2'>
            <TextTransition className='transition'>
              {questionDisplay}
            </TextTransition>
          </Typography>
        </Box>
        <Box
          sx={{
            marginLeft: 'auto',
            bgcolor: '#E6F3ED',
            borderRadius: '0.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '3rem',
            width: '10.45rem',
          }}
        >
          <Typography
            sx={{
              color: '#8FC0A9',
              fontWeight: 700,
            }}
          >
            {questions.length - questionsAnswered} questions left
          </Typography>
        </Box>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={4} sx={{ position: 'relative' }}>
          <Box
            sx={{
              height: '100%',
              width: '100%',
              bgcolor: '#DDDDDD',
              borderRadius: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Player
              loop
              src='/Interviewer.json'
              style={{ width: '25rem' }}
              ref={interviewerPlayer}
              speed={1.25}
            ></Player>
          </Box>
          <Chip
            icon={
              <PersonIcon sx={{ '&.MuiChip-icon': { color: '#FFFFFF8A' } }} />
            }
            label='Chandler Bing'
            sx={{
              position: 'absolute',
              zIndex: 5,
              bottom: '1rem',
              left: '2.5rem',
              backgroundColor: '#00000052',
              color: '#FFFFFFA1',
              fontWeight: 700,
            }}
          ></Chip>
        </Grid>
        <Grid item xs={8} sx={{ position: 'relative' }}>
          <Chip
            icon={
              <GraphicEqRoundedIcon
                sx={{ '&.MuiChip-icon': { color: '#AF6161' } }}
              />
            }
            className={interviewerTalking ? 'show' : 'hide'}
            label='Please wait for the interviewer to finish speaking'
            sx={{
              position: 'absolute',
              zIndex: 5,
              top: '2.5rem',
              right: '1rem',
              backgroundColor: '#FB2D2D54',
              transition: '0.5s',
            }}
          ></Chip>
          <Chip
            icon={
              <GraphicEqRoundedIcon
                sx={{ '&.MuiChip-icon': { color: '#799D8C' } }}
              />
            }
            className={isRecording ? 'show' : 'hide'}
            label='You may answer the question now'
            sx={{
              position: 'absolute',
              zIndex: 5,
              top: '2.5rem',
              right: '1rem',
              backgroundColor: '#28C17B4D',
              transition: '0.5s',
            }}
          ></Chip>
          <Chip
            icon={
              <PersonIcon sx={{ '&.MuiChip-icon': { color: '#FFFFFF8A' } }} />
            }
            label={userDetails.name}
            sx={{
              position: 'absolute',
              zIndex: 5,
              bottom: '1rem',
              left: '2.5rem',
              backgroundColor: '#00000052',
              color: '#FFFFFFA1',
              fontWeight: 700,
            }}
          ></Chip>

          <WebCamera />
        </Grid>
      </Grid>
      <Box sx={{ display: 'flex', justifyContent: 'end', gap: 2 }} mt={2}>
        <Button
          variant='error'
          disabled={isRecording ? false : true}
          startIcon={<ReplayIcon />}
          onClick={redoQuestion}
        >
          Redo
        </Button>
        <Button
          disabled={isRecording || interviewComplete ? false : true}
          variant='outlined'
          onClick={stopRecording}
          endIcon={
            questionsAnswered == questions.length ? null : <ArrowForward />
          }
          startIcon={
            questionsAnswered == questions.length ? (
              <CallEndRoundedIcon />
            ) : null
          }
          sx={{ padding: '.5rem 1.5rem', boxShadow: 'none' }}
        >
          {questionsAnswered == questions.length
            ? 'End Interview'
            : 'Next Question'}
        </Button>
      </Box>
    </>
  );
}
