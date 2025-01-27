import * as React from 'react';
import { useRef, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux'


import { imageOnChange } from './slices/imageSlice'
import { apiConfigLoad, fetchAPIConfigsAsync, BAES_URI } from './slices/apiConfigSlice'


//import mui 
import Grid from '@mui/material/Unstable_Grid2'; // Grid version 1
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Input from '@mui/material/Input';
import Slider from '@mui/material/Slider';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormLabel from '@mui/material/FormLabel';
import Divider from '@mui/material/Divider';
import LinearProgress from '@mui/material/LinearProgress';

import Zoom from 'react-medium-image-zoom'
import 'react-medium-image-zoom/dist/styles.css'


import Alert from '@mui/material/Alert';
import IconButton from '@mui/material/IconButton';
import Collapse from '@mui/material/Collapse';

import CloseIcon from '@mui/icons-material/Close';

import Image from 'mui-image'

import axios from 'axios'



const ImageSize = [
    [768, 512],
    [704, 512],
    [640, 512],
    [576, 512],
    [512, 512],
    [512, 576],
    [512, 640],
    [512, 704],
    [512, 768],
]






const PostPrompt = (prompt, width, height, steps, seeds, dispath, loadingHandler) => {
    dispath(imageOnChange([]))
    const config = {
        headers: {
            "X-AIGC-Token": ""
        }
    };

    axios.post(BAES_URI + "/invocations", { "prompt": prompt, "width": width, "height": height, "steps": steps, "seed": parseInt(seeds), count: 4 }, config).then((response) => {
        console.log(response.data);
        //imageHander(response.data.result[0])
        dispath(imageOnChange(response.data.result))
        loadingHandler({ display: 'none' })

    }).catch(function (error) {
        console.log(error.response)

    })

}


const AsyncPostPrompt = (SMEndpointInfo, prompt, width, height, steps, seeds, imageCount, dispath, loadingHandler) => {
   
    dispath(imageOnChange([]))

    console.log(SMEndpointInfo)
    const sm_endpoint = SMEndpointInfo.split(",")[0]
    const hit = SMEndpointInfo.split(",")[1]
    const config = {
        headers: {
            "X-SM-Endpoint": sm_endpoint
        }
    };
    if (hit != "") {
        prompt = hit + "," + prompt
    }
    if (imageCount > 5) {
        imageCount = 1
    }

    axios.post(BAES_URI + "/async_hander", { "prompt": prompt, "width": width, "height": height, "steps": steps, "seed": parseInt(seeds), "sampler": "", "count": imageCount }, config).then((response) => {
        console.log(response.data, response.data.task_id);

        let count = 0
        const timer = setInterval(() => {
            axios.get(BAES_URI + "/task/" + response.data.task_id).then((resp) => {
                if (resp.data.status == "completed") {
                    console.log("task completed")
                    if (resp.data.images.length > 0) {
                        dispath(imageOnChange(resp.data.images))
                    }

                    loadingHandler({ display: 'none' })
                    clearInterval(timer)
                }
            }).catch(function (error) {
                count = count + 1
                if (error.response.data.status != "Pending" || count > 30) {
                    clearInterval(timer)
                }
            })

        }, 1000);
    }).catch(function (error) {
        console.log(error.response)
    })

}


export default function GeneratorUI() {

    const images = useSelector((state) => state.image.value)
    const apiConfigs = useSelector((state) => state.apiConfig.value)



    const dispatch = useDispatch()
    const refPrompt = useRef();

    //load apiconfig
    if (apiConfigs.length == 0) {
        dispatch(fetchAPIConfigsAsync())

    }


    const [styleOption, setStyleOption] = useState("");
    const [imageSizeIdx, setImageSizeIdx] = useState(0);
    const [steps, setSteps] = useState(20);
    const [imageCount, setImagesCount] = useState(1);
    const [seeds, setSeeds] = useState(-1);
    const [open, setOpen] = useState(false);

    const [errorMessage, setErrorMessage] = useState("");


    const [progress, setProgress] = React.useState(10);
    const [loading, setLoading] = React.useState({ display: 'none' });


    const onChange = e => {
        console.log(e.target.value);
        setStyleOption(e.target.value);
    };

    const imageSizeOnChange = e => {
        setImageSizeIdx(e.target.value);
    };

    const renderListOfImages = (images) => {
        return images.map(image =>
            <Zoom key="{Math.random().toString(36)}">
                <Image width={300} src={image} errorIcon={null}></Image>
            </Zoom>)
    }


    React.useEffect(() => {
        const timer = setInterval(() => {
            setProgress((progress) => (progress >= 100 ? 10 : progress + 10));
        }, 1000);
        return () => {
            clearInterval(timer);
        };
    }, []);



    return (

        <Box sx={{ flexGrow: 1 }}>

            <Grid container spacing={2}>
                <Grid xs={12}>
                    <Collapse in={open}>
                        <Alert severity="error"
                            action={
                                <IconButton
                                    aria-label="close"
                                    color="inherit"
                                    size="small"
                                    onClick={() => {
                                        setOpen(false);
                                    }}
                                >
                                    <CloseIcon fontSize="inherit" />
                                </IconButton>
                            }
                            sx={{ mb: 2 }}
                        >
                            {errorMessage}
                        </Alert>
                    </Collapse>

                </Grid>
                <Grid xs={8}>

                    <TextField
                        inputRef={refPrompt}
                        id="outlined-multiline-static"
                        label="Prompt"
                        multiline
                        fullWidth
                        rows={3}
                        defaultValue="a photo of an astronaut riding a horse on moon"
                    //defaultValue="1girl, brown hair, green eyes, colorful, autumn, cumulonimbus clouds, lighting, blue sky, falling leaves, garden"
                    />

                </Grid>
                <Grid xs={4}>
                    <FormLabel id="demo-radio-buttons-group-label">Steps</FormLabel>
                    <Slider valule={steps} min={20} max={50} valueLabelDisplay="auto" onChange={(e) => setSteps(e.target.value)} />

                    <FormLabel id="demo-radio-buttons-group-label">Image Size</FormLabel>
                    <Slider value={imageSizeIdx} min={0} max={8} valueLabelDisplay="auto" onChange={imageSizeOnChange} valueLabelFormat={(x) => ImageSize[x][0] + "x" + ImageSize[x][1]} />

                </Grid>
                <Grid xs={4}>
                    <TextField
                        id="outlined-multiline-static"
                        label="Negative prompt"
                        multiline
                        fullWidth
                        rows={1}
                        placeholder="Negative prompt"
                    />
                </Grid>
                <Grid xs={4}>
                    <FormLabel id="demo-radio-buttons-group-label">Seeds</FormLabel>
                    <Input
                        id="outlined-multiline-static"
                        fullWidth
                        rows={1}
                        value={seeds}
                        onChange={(e) => setSeeds(e.target.value)}
                    />

                </Grid>
                <Grid xs={4}>

                    <RadioGroup
                        row
                        aria-labelledby="demo-row-radio-buttons-group-label"
                        name="row-radio-buttons-group"
                        onChange={onChange}
                        value={styleOption}

                    >

                        {
                            apiConfigs.map((item, i) => {
                                return <FormControlLabel key={i} value={item.sm_endpoint + "," + item.hit} control={<Radio />} label={item.label} />
                            })
                        }

                    </RadioGroup>
                </Grid>


                <Grid xs={12}>

                </Grid>
                <Grid xs={5}>
                </Grid>
                <Grid sx={{ width: 120 }}>
                    <FormLabel id="demo-count-buttons-group-label">Image Count</FormLabel>
                    <Slider valule={steps} min={1} max={5} valueLabelDisplay="auto" onChange={(e) => setImagesCount(e.target.value)} />
                </Grid>
                <Grid xs={5}></Grid>
                <Grid xs={5}>
                </Grid>
                <Grid xs={4}>

                    <Button variant="contained" color="success" onClick={() => {
                        if (styleOption == "") {
                            setErrorMessage("your need select a model.");
                            setOpen(true);
                            return
                        }
                        
                        
                        console.log(refPrompt.current.value, styleOption, steps, ImageSize[imageSizeIdx], seeds)
                        setOpen(false)
                        setLoading({})
                        setProgress(0)
                        AsyncPostPrompt(styleOption, ` ${refPrompt.current.value}`, ImageSize[imageSizeIdx][0], ImageSize[imageSizeIdx][1], steps, seeds, imageCount, dispatch, setLoading)

                    }}
                    >Generate</Button>

                </Grid>
                <Grid xs={12}>
                    <Divider></Divider>
                    <LinearProgress variant="determinate" value={progress} sx={loading} />
                </Grid>
                <Grid xs={4}></Grid>
                <Grid xs={4}>
                    {renderListOfImages(images)}
                </Grid>

            </Grid>
        </Box>

    );
}
