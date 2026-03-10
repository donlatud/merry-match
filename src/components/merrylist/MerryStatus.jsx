import React from 'react'

export const MerryStatus = ({ status }) => {
  const merryStatus = status;

  return (
    <>
      {merryStatus === 1 ?
        <div className='px-4 flex justify-center items-center gap-1 py-1 border border-red-500 rounded-full'>
            <img src="/merry_icon/icon-match-status.svg" alt="" className='w-5 h-3' />
            <h1 className='text-red-500 text-body3 font-extrabold'>Merry Match!</h1>
        </div>
        :
        <div className='px-4 py-1 border border-gray-500 rounded-full'>
          <h1 className='text-body2 text-gray-700'>Not Match yet</h1>

        </div>
      }
    </>
  )
}
