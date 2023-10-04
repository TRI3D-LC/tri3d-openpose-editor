interface ButtonProps {
  PoseExtractionCall: () => void;
}
  
export const buttonStyle: React.CSSProperties = {
  backgroundColor: '#4CAF50', 
  border: 'none', 
  color: 'white', 
  padding: '15px 32px', 
  textAlign: 'center', 
  textDecoration: 'none', 
  display: 'inline-block',
  fontSize: '16px', 
  margin: '4px 2px', 
  cursor: 'pointer', 
  borderRadius: '12px'
};

export const imageStyle = {
    borderRadius:"15px", 
    backgroundColor: '#888'
}
  
export const defaultImageSrc = 'data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==';


  