import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './styles/findpassword.module.css';
import { googleSheetsService } from '../../services/googleSheetsService';

function FindPassword(){

    return(
        <p>비밀번호 찾기</p>
    );
}
export default FindPassword;